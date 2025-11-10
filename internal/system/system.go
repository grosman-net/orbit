package system

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"orbit/internal/util"
)

type Summary struct {
	Hostname       string  `json:"hostname"`
	Uptime         int64   `json:"uptime"`
	LoadAverage    []float64 `json:"loadAverage"`
	CPUCores       int     `json:"cpuCores"`
	CPUUsage       float64 `json:"cpuUsage"`
	MemTotal       uint64  `json:"memTotal"`
	MemUsed        uint64  `json:"memUsed"`
	MemFree        uint64  `json:"memFree"`
	MemUsage       float64 `json:"memUsage"`
	SwapTotal      uint64  `json:"swapTotal"`
	SwapUsed       uint64  `json:"swapUsed"`
	SwapUsage      float64 `json:"swapUsage"`
	DiskTotal      uint64  `json:"diskTotal"`
	DiskUsed       uint64  `json:"diskUsed"`
	DiskUsage      float64 `json:"diskUsage"`
	DiskReadBps    uint64  `json:"diskReadBps"`
	DiskWriteBps   uint64  `json:"diskWriteBps"`
	NetworkRxBps   uint64  `json:"networkRxBps"`
	NetworkTxBps   uint64  `json:"networkTxBps"`
	Processes      int     `json:"processes"`
	OS             string  `json:"os"`
	Kernel         string  `json:"kernel"`
}

func GetSummary() (*Summary, error) {
	s := &Summary{}

	// Hostname
	hostname, _ := os.Hostname()
	s.Hostname = hostname

	// Uptime
	uptimeData, _ := os.ReadFile("/proc/uptime")
	if len(uptimeData) > 0 {
		fields := strings.Fields(string(uptimeData))
		if len(fields) > 0 {
			uptime, _ := strconv.ParseFloat(fields[0], 64)
			s.Uptime = int64(uptime)
		}
	}

	// Load average
	loadavgData, _ := os.ReadFile("/proc/loadavg")
	if len(loadavgData) > 0 {
		fields := strings.Fields(string(loadavgData))
		if len(fields) >= 3 {
			load1, _ := strconv.ParseFloat(fields[0], 64)
			load5, _ := strconv.ParseFloat(fields[1], 64)
			load15, _ := strconv.ParseFloat(fields[2], 64)
			s.LoadAverage = []float64{load1, load5, load15}
		}
	}

	// CPU cores
	cpuinfoData, _ := os.ReadFile("/proc/cpuinfo")
	s.CPUCores = strings.Count(string(cpuinfoData), "processor")

	// CPU usage (simplified)
	s.CPUUsage = getCPUUsage()

	// Memory
	meminfo, _ := os.ReadFile("/proc/meminfo")
	memMap := parseMeminfo(string(meminfo))
	s.MemTotal = memMap["MemTotal"]
	s.MemFree = memMap["MemFree"] + memMap["Buffers"] + memMap["Cached"]
	s.MemUsed = s.MemTotal - s.MemFree
	if s.MemTotal > 0 {
		s.MemUsage = float64(s.MemUsed) / float64(s.MemTotal) * 100
	}

	// Swap
	s.SwapTotal = memMap["SwapTotal"]
	s.SwapUsed = s.SwapTotal - memMap["SwapFree"]
	if s.SwapTotal > 0 {
		s.SwapUsage = float64(s.SwapUsed) / float64(s.SwapTotal) * 100
	}

	// Disk (root filesystem)
	diskUsage, _ := getDiskUsage("/")
	s.DiskTotal = diskUsage.Total
	s.DiskUsed = diskUsage.Used
	s.DiskUsage = diskUsage.Usage

	// Disk I/O
	diskIO := getDiskIO()
	s.DiskReadBps = diskIO.ReadBps
	s.DiskWriteBps = diskIO.WriteBps

	// Network I/O
	netIO := getNetworkIO()
	s.NetworkRxBps = netIO.RxBps
	s.NetworkTxBps = netIO.TxBps

	// Processes
	s.Processes = countProcesses()

	// OS & Kernel
	osRelease, _ := os.ReadFile("/etc/os-release")
	for _, line := range strings.Split(string(osRelease), "\n") {
		if strings.HasPrefix(line, "PRETTY_NAME=") {
			s.OS = strings.Trim(strings.TrimPrefix(line, "PRETTY_NAME="), "\"")
			break
		}
	}
	unameOut, _ := util.RunCommandNoSudo("uname", "-r")
	s.Kernel = strings.TrimSpace(unameOut)

	return s, nil
}

func parseMeminfo(data string) map[string]uint64 {
	result := make(map[string]uint64)
	for _, line := range strings.Split(data, "\n") {
		fields := strings.Fields(line)
		if len(fields) >= 2 {
			key := strings.TrimSuffix(fields[0], ":")
			value, _ := strconv.ParseUint(fields[1], 10, 64)
			result[key] = value * 1024 // Convert kB to bytes
		}
	}
	return result
}

type diskUsage struct {
	Total uint64
	Used  uint64
	Usage float64
}

func getDiskUsage(path string) (diskUsage, error) {
	out, err := util.RunCommandNoSudo("df", "-B1", path)
	if err != nil {
		return diskUsage{}, err
	}
	lines := strings.Split(strings.TrimSpace(out), "\n")
	if len(lines) < 2 {
		return diskUsage{}, fmt.Errorf("unexpected df output")
	}
	fields := strings.Fields(lines[1])
	if len(fields) < 5 {
		return diskUsage{}, fmt.Errorf("unexpected df fields")
	}
	total, _ := strconv.ParseUint(fields[1], 10, 64)
	used, _ := strconv.ParseUint(fields[2], 10, 64)
	usage := 0.0
	if total > 0 {
		usage = float64(used) / float64(total) * 100
	}
	return diskUsage{Total: total, Used: used, Usage: usage}, nil
}

type diskIO struct {
	ReadBps  uint64
	WriteBps uint64
}

var lastDiskIO diskIO
var lastDiskIOTime time.Time

func getDiskIO() diskIO {
	// Read /proc/diskstats and calculate bytes/sec
	data, err := os.ReadFile("/proc/diskstats")
	if err != nil {
		return diskIO{}
	}

	var totalRead, totalWrite uint64
	for _, line := range strings.Split(string(data), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 14 {
			continue
		}
		// Skip loop and ram devices
		devName := fields[2]
		if strings.HasPrefix(devName, "loop") || strings.HasPrefix(devName, "ram") {
			continue
		}
		// fields[5] = sectors read, fields[9] = sectors written
		sectorsRead, _ := strconv.ParseUint(fields[5], 10, 64)
		sectorsWritten, _ := strconv.ParseUint(fields[9], 10, 64)
		totalRead += sectorsRead * 512  // sector size is typically 512 bytes
		totalWrite += sectorsWritten * 512
	}

	now := time.Now()
	if lastDiskIOTime.IsZero() {
		lastDiskIO = diskIO{0, 0}
		lastDiskIOTime = now
		return diskIO{}
	}

	elapsed := now.Sub(lastDiskIOTime).Seconds()
	if elapsed > 0 {
		readBps := uint64(float64(totalRead-lastDiskIO.ReadBps) / elapsed)
		writeBps := uint64(float64(totalWrite-lastDiskIO.WriteBps) / elapsed)
		lastDiskIO = diskIO{totalRead, totalWrite}
		lastDiskIOTime = now
		return diskIO{ReadBps: readBps, WriteBps: writeBps}
	}

	return diskIO{}
}

type networkIO struct {
	RxBps uint64
	TxBps uint64
}

var lastNetIO networkIO
var lastNetIOTime time.Time

func getNetworkIO() networkIO {
	data, err := os.ReadFile("/proc/net/dev")
	if err != nil {
		return networkIO{}
	}

	var totalRx, totalTx uint64
	for _, line := range strings.Split(string(data), "\n") {
		if !strings.Contains(line, ":") {
			continue
		}
		parts := strings.Split(line, ":")
		if len(parts) != 2 {
			continue
		}
		iface := strings.TrimSpace(parts[0])
		if iface == "lo" {
			continue
		}
		fields := strings.Fields(parts[1])
		if len(fields) < 9 {
			continue
		}
		rxBytes, _ := strconv.ParseUint(fields[0], 10, 64)
		txBytes, _ := strconv.ParseUint(fields[8], 10, 64)
		totalRx += rxBytes
		totalTx += txBytes
	}

	now := time.Now()
	if lastNetIOTime.IsZero() {
		lastNetIO = networkIO{totalRx, totalTx}
		lastNetIOTime = now
		return networkIO{}
	}

	elapsed := now.Sub(lastNetIOTime).Seconds()
	if elapsed > 0 {
		rxBps := uint64(float64(totalRx-lastNetIO.RxBps) / elapsed)
		txBps := uint64(float64(totalTx-lastNetIO.TxBps) / elapsed)
		lastNetIO = networkIO{totalRx, totalTx}
		lastNetIOTime = now
		return networkIO{RxBps: rxBps, TxBps: txBps}
	}

	return networkIO{}
}

func countProcesses() int {
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return 0
	}
	count := 0
	for _, entry := range entries {
		if entry.IsDir() {
			if _, err := strconv.Atoi(entry.Name()); err == nil {
				count++
			}
		}
	}
	return count
}

var lastCPUStat cpuStat
var lastCPUTime time.Time

type cpuStat struct {
	user   uint64
	nice   uint64
	system uint64
	idle   uint64
	iowait uint64
	irq    uint64
	softirq uint64
}

func getCPUUsage() float64 {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return 0
	}

	lines := strings.Split(string(data), "\n")
	if len(lines) == 0 {
		return 0
	}

	fields := strings.Fields(lines[0])
	if len(fields) < 8 || fields[0] != "cpu" {
		return 0
	}

	current := cpuStat{}
	current.user, _ = strconv.ParseUint(fields[1], 10, 64)
	current.nice, _ = strconv.ParseUint(fields[2], 10, 64)
	current.system, _ = strconv.ParseUint(fields[3], 10, 64)
	current.idle, _ = strconv.ParseUint(fields[4], 10, 64)
	current.iowait, _ = strconv.ParseUint(fields[5], 10, 64)
	current.irq, _ = strconv.ParseUint(fields[6], 10, 64)
	current.softirq, _ = strconv.ParseUint(fields[7], 10, 64)

	now := time.Now()
	if lastCPUTime.IsZero() {
		lastCPUStat = current
		lastCPUTime = now
		return 0
	}

	totalDelta := (current.user - lastCPUStat.user) +
		(current.nice - lastCPUStat.nice) +
		(current.system - lastCPUStat.system) +
		(current.idle - lastCPUStat.idle) +
		(current.iowait - lastCPUStat.iowait) +
		(current.irq - lastCPUStat.irq) +
		(current.softirq - lastCPUStat.softirq)

	idleDelta := current.idle - lastCPUStat.idle

	lastCPUStat = current
	lastCPUTime = now

	if totalDelta == 0 {
		return 0
	}

	usage := 100.0 * (1.0 - float64(idleDelta)/float64(totalDelta))
	return usage
}

