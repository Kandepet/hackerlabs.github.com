---
layout: post
title: "From bits to waves - The inner workings of an ethernet controller"
date: 2012-05-09 06:57
comments: true
categories:
- Internals
keywords: "Linux network driver, eepro100, Intel 82559, 8255x, Linux Ethernet Driver internals, Deepak Kandepet, Kandepet"
description: "Understand the internals of an Ethernet driver and how it interfaces with the linkx kernel on one side and the network on the other side"
---
About 10 years ago, I started hacking the Linux kernel. My interest was the TCP/IP stack and specifically the workings
of an Ethernet controller and its Linux driver. I picked one of the most widely used Ethernet controllers at that time,
the [Intel 82559 10/100 Fast Ethernet Controller](http://www.intel.com/design/network/products/lan/controllers/82559.htm
"Intel 82559 10/100 Fast Ethernet Controller") and one of its open-source drivers, the eepro100. My original aim was to
write a book, but after 10 years, I think its time I shared what I learnt.

In this article I want to talk about how the eepro100 driver interfaces with the Intel 82559 chipset and how the 82559
converts the packets sent by the driver to signals transmitted over physical wires. So, without further ado:

## The mighty 82559
The 82559 is an Intel ethernet chipset. It supports 10/100 Mbps full duplex data communication over a pair of wires.
This is a high level block diagram of the 82559.

{% cimg /images/from-bits-to-waves/82559-Block-Diagram.png Block Diagram of 82559%}

The most important subsystems of 82559 are:

- A parallel subsystem (shown in green).
- A FIFO subsystem (shown in red).
- The 10/100 Mbps Carrier Sense Multiple Access with Collision Detect (CSMA/CD) unit (shown in blue).
- The 10/100 Mbps physical layer (PHY) unit (shown in black).

### The parallel subsystem
The parallel subsystem is responsible for interfacing the chipset with the motherboard via the PCI bus. It also controls
and executes all the chipset's functions via a Micro-Machine.

As a PCI device, 82559 can operate in two modes:

- As a PCI target (slave mode). In slave mode, 82559 is completely controlled by the host CPU. The CPU initiates all
  transmit and receive actions when 82559 is in slave mode.
- For processing the transmit and receive frames, the 82559 operates as a master on the PCI bus. It needs no help from
  the host CPU to read/write memory or other resources and can work independently.


The **micromachine ** is an embedded processing unit. Instructions for carrying out all the 82559's functions are
embedded in a microcode ROM within the micromachine. The micromachine is divided into two units:

- **Receive Unit (RU)**
- **Command Unit (CU)**. The CU is also the transmit unit.

These two units operate independently and concurrently. Control is switched between the two units according to the
microcode instruction flow. The independence of the Receive and Command units in the micromachine allows the 82559 to
execute commands and receive incoming frames simultaneously, with no real-time CPU intervention.

The 82559 also interfaces with an external Flash memory and an external serial EEPROM. The **Flash memory** may be used
for remote boot functions, network statistics, diagnostics and management functions. The **EEPROM** is used to store
relevant information for a LAN connection such as node address (MAC Address), as well as board manufacturing and
configuration information.
### FIFO Subsystem
The 82559 FIFO (First In, First Out) subsystem consists of a 3 Kbyte transmit FIFO and 3 Kbyte receive FIFO. Each FIFO
is unidirectional and independent of the other. The FIFO subsystem serves as the interface between the 82559 parallel
side and the serial CSMA/CD unit. It provides a temporary buffer storage area for frames as they are either being
received or transmitted by the 82559. Transmit frames can be queued within the transmit FIFO, allowing back-to-back
transmission within the <a title="Interframe gap" href="http://en.wikipedia.org/wiki/Interframe_gap">minimum Interframe
Spacing (IFS)</a>. Transmissions resulting in errors (collision detection or data underruns) are re-transmitted directly
from the 82559 FIFO eliminating the need to re-access this data from the host system.
### CSMA/CD unit
The CSMA/CD unit of the 82559 allows it to be connected to either a 10 or 100 Mbps Ethernet network. The CSMA/CD unit
performs all of the functions of the 802.3 protocol such as <a title="CSMA/CD"
href="http://en.wikipedia.org/wiki/CSMA/CD">frame formatting, frame stripping, collision handling, deferral to link
traffic</a>, etc. The CSMA/CD unit can also be placed in a full duplex mode which allows simultaneous transmission and
reception of frames.
### Physical Unit (PHY)
The <a title="PHY Layer" href="http://en.wikipedia.org/wiki/PHY_%28chip%29">Physical Layer (PHY)</a> unit of the 82559
is where the digital data is converted to a signal that can propagate over the network wires. To make the actual
connection to the network, additional components such as transformers anmpedances re needed. This additional components
are external to 82559.
### Accessing 82559 as a PCI device
A PCI peripheral boards can be accessed using three different address spaces: memory locations, I/O ports, and
configuration registers.

- The memory and I/O port address space is shared by all devices on a PCI bus (i.e., when you access a memory location,
  all the devices see the bus cycle at the same time). A driver can read memory and I/O regions via inb, readb, and so
forth.
- The configuration space, on the other hand, exploits geographical addressing. i.e. each PCI slot is uniquely addressed
  (by a 16 bit address), thus eliminating collisions when configuring devices. To access the configuration space of
82559, the full configuration address (bus, slot, function, offset) is written to an I/O port (for 82559, CONFIG_ADDRESS
= 0xCF8) and then the 32-bit word at this address can be read or written through another location (for 82559,
CONFIG_DATA = 0xCFC ).

After a PCI device is powered on, the hardware remains in an inactive state and the will only respond to configuration
transactions. This is because, at power on, the device does not have its memory and I/O ports mapped into the computer's
address space. Every other device-specific feature, such as interrupt reporting, is disabled as well.

After power on, the BIOS must first scan the PCI bus to determine what PCI device exists and what configuration
requirements they have. In order to facilitate this process, all PCI devices, including 82559, must implement a base set
of configuration registers as defined by the PCe standard registers defined by 82559 is shown in the figure below.

{% cimg /images/from-bits-to-waves/82559ConfigSpace.jpg 82559 Config Space %}

The BIOS reads the Vendor ID, Device ID and Class registers in order to detect the device and its type. 82559 being an
Intel device, returns a hard-coded 8086H for Device ID.
### Memory &amp; IO Mapping the 82559 device.
Having detected 82559, the BIOS then accesses 82559's base address configuration registers to determine how many blocks
of memory and/or IO space the device requires. Ese Address Register (BAR) is 32 bits wide and there can be upto 6 BARs
per device. 82559 defines 3 types of BARs, the Control/Status Registers (CSR), Flash, and Expansion ROM as shown in
figure above.

{% cimg /images/from-bits-to-waves/BAR.jpg Base Address Register (BAR) %}

Bit zero in all base registers is read only and is used to determine whether the register maps into memory (0) or I/O
space (1).ach bove shows the layout of a BAR for memory mapping.

The 82559 contains three BARs, two requesting memory mapped resources and one requesting IO mapping.
specification.ontrol and Status Register (CSR) is both Memory Mapped (CSR Memory mapped base address register: 10H) and
IO mapped (CSR I/O Mapped Base Address Register: 14H) to anywhere within the 32- bit memory address space. It is up to
the driver (eepro100) to determine which BAR (I/O or Memory) to use to access the 82559 Control/Status registers. The
size of the memory space is 4Kb and that of I/O space is 32 bytes. The 82559 also requires one BAR (Flash Memory Mapped
Base Address Register: 18H) to map accesses to an optional FLASH memory.

After determining the types of mapping and amount of memory/IO space requested from the BARs, BIOS maps the I/O and
memory controllers into available memory locations and proceeds with system boot.
### The Kernel PCI Initialization
As described above, for Intel based systems the system BIOS which ran at boot time has already fully configured the PCI
system. This leaves Linux kernel with little to do other than remap that configuration.

The PCI device driver (pci.c) starts by scanning PCI Buses and creates a pci_dev for every device (including PCI-to-PCI
bridges) and pci_bus for every bus it finds. These structures are linked together into a tree that mimics the actual PCI
topology.

{% cimg /images/from-bits-to-waves/PCITree.jpg PCI Tree %}

At this stage, the BIOS has recognized the 82559 and configured its PCI configuration space assigning it unique memory
and IO space and the Linux kernel has created a pci_dev data structure defining 82559.
### 82559 PCI Initialization
When the eepro100 driver module is loaded into the kernel, the driver registers itself as a PCI driver by calling
*pci_register_driver()*. Implicitly passed to *pci_register_driver()* is a table of all supported devices
(*eepro100_pci_tbl*).
over serves a range of Intel chipsets: 82557, 82558, 82559, 82801, etc.

``` c
static struct pci_device_id eepro100_pci_tbl[] = {
    { PCI_VENDOR_ID_INTEL, PCI_DEVICE_ID_INTEL_82557,
        PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, PCI_DEVICE_ID_INTEL_82559ER,
        PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, PCI_DEVICE_ID_INTEL_82801BA_7,
        PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1029, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1030, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1031, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1032, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1033, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1034, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1035, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1036, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1037, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1038, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1039, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x103A, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x103B, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x103C, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x103D, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x103E, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1050, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1059, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1227, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x1228, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x2449, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x2459, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x245D, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x5200, PCI_ANY_ID, PCI_ANY_ID, },
    { PCI_VENDOR_ID_INTEL, 0x5201, PCI_ANY_ID, PCI_ANY_ID, },
    { 0,}
};
MODULE_DEVICE_TABLE(pci, eepro100_pci_tbl);

```
After registering the driver, *pci_register_driver()* probes [*pci_device_probe()*] the PCI device tree
for all unclaimed PCI devices. Chances are that one of those devices could be an eepro100 compatible device. When an
unclaimed device is found, *pci_bus_match()* and *pci_match_device()* are called to check if this
unclaimed device is an eepro100 compliant PCI device.

*pci_match_device()* checks if the PCI_VENDOR_ID, PCI_DEVICE_ID, PCI_SUBVENDOR_ID, PCI_SUBDEVICE_ID from the
*eepro100_pci_tbl* and the device configure header values match (see 82559 configuration space figure above). If
a match is found, eepro100's probe function, *eepro100_init_one()*, is called to reset/probe the new device.
After the probe is complete, the device is marked as claimed by eepro100.

``` c
static int __devinit eepro100_init_one (struct pci_dev *pdev,
        const struct pci_device_id *ent)
{
    void __iomem *ioaddr;
    int irq, pci_bar;
    int acpi_idle_state = 0, pm;
    static int cards_found /* = 0 */;
    unsigned long pci_base;

#ifndef MODULE
    /* when built-in, we only print version if device is found */
    static int did_version;
    if (did_version++ == 0)
        printk(version);
#endif

    /* save power state before pci_enable_device overwrites it */
    pm = pci_find_capability(pdev, PCI_CAP_ID_PM);
    if (pm) {
        u16 pwr_command;
        pci_read_config_word(pdev, pm + PCI_PM_CTRL, &amp;pwr_command);
        acpi_idle_state = pwr_command &amp; PCI_PM_CTRL_STATE_MASK;
    }

    if (pci_enable_device(pdev))
        goto err_out_free_mmio_region;

    pci_set_master(pdev);

    if (!request_region(pci_resource_start(pdev, 1),
            pci_resource_len(pdev, 1), "eepro100")) {
        printk (KERN_ERR "eepro100: cannot reserve I/O ports\n");
        goto err_out_none;
    }
    if (!request_mem_region(pci_resource_start(pdev, 0),
            pci_resource_len(pdev, 0), "eepro100")) {
        printk (KERN_ERR "eepro100: cannot reserve MMIO region\n");
        goto err_out_free_pio_region;
    }

    irq = pdev-&gt;irq;
    pci_bar = use_io ? 1 : 0;
    pci_base = pci_resource_start(pdev, pci_bar);
    if (DEBUG &amp; NETIF_MSG_PROBE)
        printk("Found Intel i82557 PCI Speedo at %#lx, IRQ %d.\n",
            pci_base, irq);

    ioaddr = pci_iomap(pdev, pci_bar, 0);
    if (!ioaddr) {
        printk (KERN_ERR "eepro100: cannot remap IO\n");
        goto err_out_free_mmio_region;
    }

    if (speedo_found1(pdev, ioaddr, cards_found, acpi_idle_state) == 0)
        cards_found++;
    else
        goto err_out_iounmap;

    return 0;

err_out_iounmap: ;
    pci_iounmap(pdev, ioaddr);
err_out_free_mmio_region:
    release_mem_region(pci_resource_start(pdev, 0), pci_resource_len(pdev, 0));
err_out_free_pio_region:
    release_region(pci_resource_start(pdev, 1), pci_resource_len(pdev, 1));
err_out_none:
    return -ENODEV;
}

```
*pci_find_capability()*: Every device that supports PCI power management, including 82559, has an 8 byte
capability field in its PCI configuration space (See address DCh - Eoh in the figure above). This field is used to
describe and control the standard PCI power management features. The PCI PM spec defines 4 operating states for devices,
D0 - D3. The higher the number, less power the device consumes but longer is the latency for the device to return to the
operational state (D0). 82559 supports all 4 power states. *pci_enable_device()* (via
*pci_set_power_state()*) activates 82559 by switching it to the D0 state.

*pci_set_master()*: If the device has bus mastering capability, during bootup the BIOS can read two of its
configuration registers (Minimum Grant register: Min_Gnt and Maximum Latency register: Max_Lat, see configuration
registers in the above figure) to determine how quickly it requires access to the PCI bus when it asserts REQ# pin and
the average duration of its transfer when it has acquired ownership of the bus. The BIOS can utilize this information to
program the bus master's latency timer register and the PCI bus arbiter to provide the optimum PCI bus utilization. For
82559, the default value of Minimum Grant Register is 08H and Maximum Latency Register is 18H. pci_set_master() is
called to enable 82559 to act as a bus master.

During boot, the BIOS had allocated a range of unique memory and IO regions for accessing 82559's configuration space.
For the driver to use these regions, they have to be reserved and locked in the kernel by marking those regions as BUSY
(to prevent other drivers from accessing these same regions). *eepro100_init_one()* locks the PCI BIOS assigned
IO port regions using *request_region()* (cat /proc/ioports to see a list of all locked IO ports). Similarly to
reserve memory mapped regions *request_mem_region()* is called. This is done for all the 3 three regions pointed
to by the 3 active 82559 BARs.

The 82559 is now physically enabled and is ready to start receiving and transmitting ethernet frames. The driver now
prepares the kernel to start using this device for network access via *speedo_found1()*.
``` c

static int __devinit speedo_found1(struct pci_dev *pdev,
        void __iomem *ioaddr, int card_idx, int acpi_idle_state)
{
    struct net_device *dev;
    struct speedo_private *sp;
    const char *product;
    int i, option;
    u16 eeprom[0x100];
    int size;
    void *tx_ring_space;
    dma_addr_t tx_ring_dma;

    size = TX_RING_SIZE * sizeof(struct TxFD) + sizeof(struct speedo_stats);
    tx_ring_space = pci_alloc_consistent(pdev, size, &amp;tx_ring_dma);
    if (tx_ring_space == NULL)
        return -1;

    dev = alloc_etherdev(sizeof(struct speedo_private));
    if (dev == NULL) {
        printk(KERN_ERR "eepro100: Could not allocate ethernet device.\n");
        pci_free_consistent(pdev, size, tx_ring_space, tx_ring_dma);
        return -1;
    }

    SET_MODULE_OWNER(dev);
    SET_NETDEV_DEV(dev, &amp;pdev-&gt;dev);

    if (dev-&gt;mem_start &gt; 0)
        option = dev-&gt;mem_start;
    else if (card_idx &gt;= 0  &amp;&amp;  options[card_idx] &gt;= 0)
        option = options[card_idx];
    else
        option = 0;

    rtnl_lock();
    if (dev_alloc_name(dev, dev-&gt;name) &lt; 0)
        goto err_free_unlock;

    /* Read the station address EEPROM before doing the reset.
    Nominally his should even be done before accepting the device, but
    then we wouldn't have a device name with which to report the error.
    The size test is for 6 bit vs. 8 bit address serial EEPROMs.
    */
    {
        void __iomem *iobase;
        int read_cmd, ee_size;
        u16 sum;
        int j;

        /* Use IO only to avoid postponed writes and satisfy EEPROM timing
        requirements. */
        iobase = pci_iomap(pdev, 1, pci_resource_len(pdev, 1));
        if (!iobase)
            goto err_free_unlock;
        if ((do_eeprom_cmd(iobase, EE_READ_CMD &lt;&lt; 24, 27) &amp; 0xffe0000)
            == 0xffe0000) {
            ee_size = 0x100;
            read_cmd = EE_READ_CMD &lt;&lt; 24;
        } else {
            ee_size = 0x40;
            read_cmd = EE_READ_CMD &lt;&lt; 22;
        }

        for (j = 0, i = 0, sum = 0; i &lt; ee_size; i++) {
            u16 value = do_eeprom_cmd(iobase, read_cmd | (i &lt;&lt; 16), 27);
            eeprom[i] = value;
            sum += value;
            if (i &lt; 3) {                 dev-&gt;dev_addr[j++] = value;
                dev-&gt;dev_addr[j++] = value &gt;&gt; 8;
            }
        }
        if (sum != 0xBABA)
            printk(KERN_WARNING "%s: Invalid EEPROM checksum %#4.4x, "
                "check settings before activating this device!\n",
                dev-&gt;name, sum);
        /* Don't  unregister_netdev(dev);  as the EEPro may actually be
        usable, especially if the MAC address is set later.
        On the other hand, it may be unusable if MDI data is corrupted. */

        pci_iounmap(pdev, iobase);
    }

    /* Reset the chip: stop Tx and Rx processes and clear counters.
    This takes less than 10usec and will easily finish before the next
    action. */
    iowrite32(PortReset, ioaddr + SCBPort);
    ioread32(ioaddr + SCBPort);
    udelay(10);

    if (eeprom[3] &amp; 0x0100)
        product = "OEM i82557/i82558 10/100 Ethernet";
    else
        product = pci_name(pdev);

    printk(KERN_INFO "%s: %s, ", dev-&gt;name, product);

    for (i = 0; i &lt; 5; i++)         printk("%2.2X:", dev-&gt;dev_addr[i]);
    printk("%2.2X, ", dev-&gt;dev_addr[i]);
    printk("IRQ %d.\n", pdev-&gt;irq);

    sp = netdev_priv(dev);

    /* we must initialize this early, for mdio_{read,write} */
    sp-&gt;regs = ioaddr;

#if 1 || defined(kernel_bloat)
    /* OK, this is pure kernel bloat.  I don't like it when other drivers
    waste non-pageable kernel space to emit similar messages, but I need
    them for bug reports. */
    {
        const char *connectors[] = {" RJ45", " BNC", " AUI", " MII"};
        /* The self-test results must be paragraph aligned. */
        volatile s32 *self_test_results;
        int boguscnt = 16000;    /* Timeout for set-test. */
        if ((eeprom[3] &amp; 0x03) != 0x03)
            printk(KERN_INFO "  Receiver lock-up bug exists -- enabling"
                " work-around.\n");
        printk(KERN_INFO "  Board assembly %4.4x%2.2x-%3.3d, Physical"
            " connectors present:",
            eeprom[8], eeprom[9]&gt;&gt;8, eeprom[9] &amp; 0xff);
        for (i = 0; i &lt; 4; i++)
            if (eeprom[5] &amp; (1&lt;&gt;8)&amp;15], eeprom[6] &amp; 0x1f);
        if (eeprom[7] &amp; 0x0700)
            printk(KERN_INFO "    Secondary interface chip %s.\n",
                phys[(eeprom[7]&gt;&gt;8)&amp;7]);
        if (((eeprom[6]&gt;&gt;8) &amp; 0x3f) == DP83840
            ||  ((eeprom[6]&gt;&gt;8) &amp; 0x3f) == DP83840A) {
            int mdi_reg23 = mdio_read(dev, eeprom[6] &amp; 0x1f, 23) | 0x0422;
            if (congenb)
            mdi_reg23 |= 0x0100;
            printk(KERN_INFO"  DP83840 specific setup, setting register 23 to %4.4x.\n",
                mdi_reg23);
            mdio_write(dev, eeprom[6] &amp; 0x1f, 23, mdi_reg23);
        }
        if ((option &gt;= 0) &amp;&amp; (option &amp; 0x70)) {
            printk(KERN_INFO "  Forcing %dMbs %s-duplex operation.\n",
                (option &amp; 0x20 ? 100 : 10),
                (option &amp; 0x10 ? "full" : "half"));
            mdio_write(dev, eeprom[6] &amp; 0x1f, MII_BMCR,
                    ((option &amp; 0x20) ? 0x2000 : 0) |     /* 100mbps? */
                    ((option &amp; 0x10) ? 0x0100 : 0)); /* Full duplex? */
        }

        /* Perform a system self-test. */
        self_test_results = (s32*) ((((long) tx_ring_space) + 15) &amp; ~0xf);
        self_test_results[0] = 0;
        self_test_results[1] = -1;
        iowrite32(tx_ring_dma | PortSelfTest, ioaddr + SCBPort);
        do {
            udelay(10);
        } while (self_test_results[1] == -1  &amp;&amp;  --boguscnt &gt;= 0);

        if (boguscnt &lt; 0) {        /* Test optimized out. */             printk(KERN_ERR "Self test failed, status
%8.8x:\n"                 KERN_ERR " Failure to initialize the i82557.\n"                 KERN_ERR " Verify that the
%card is a bus-master"                 " capable slot.\n",                 self_test_results[1]);         } else
%printk(KERN_INFO "  General self-test: %s.\n"                 KERN_INFO "  Serial sub-system self-test: %s.\n"
%KERN_INFO "  Internal registers self-test: %s.\n"                 KERN_INFO "  ROM checksum self-test: %s (%#8.8x).\n",
%self_test_results[1] &amp; 0x1000 ? "failed" : "passed",                 self_test_results[1] &amp; 0x0020 ? "failed" :
%"passed",                 self_test_results[1] &amp; 0x0008 ? "failed" : "passed",                 self_test_results[1]
%&amp; 0x0004 ? "failed" : "passed",                 self_test_results[0]);     } #endif  /* kernel_bloat */
%iowrite32(PortReset, ioaddr + SCBPort);     ioread32(ioaddr + SCBPort);     udelay(10);     /* Return the chip to its
%original power state. */     pci_set_power_state(pdev, acpi_idle_state);     pci_set_drvdata (pdev, dev);
%SET_NETDEV_DEV(dev, &amp;pdev-&gt;dev);

    dev-&gt;irq = pdev-&gt;irq;

    sp-&gt;pdev = pdev;
    sp-&gt;msg_enable = DEBUG;
    sp-&gt;acpi_pwr = acpi_idle_state;
    sp-&gt;tx_ring = tx_ring_space;
    sp-&gt;tx_ring_dma = tx_ring_dma;
    sp-&gt;lstats = (struct speedo_stats *)(sp-&gt;tx_ring + TX_RING_SIZE);
    sp-&gt;lstats_dma = TX_RING_ELEM_DMA(sp, TX_RING_SIZE);
    init_timer(&amp;sp-&gt;timer); /* used in ioctl() */
    spin_lock_init(&amp;sp-&gt;lock);

    sp-&gt;mii_if.full_duplex = option &gt;= 0 &amp;&amp; (option &amp; 0x10) ? 1 : 0;
    if (card_idx &gt;= 0) {
        if (full_duplex[card_idx] &gt;= 0)
            sp-&gt;mii_if.full_duplex = full_duplex[card_idx];
    }
    sp-&gt;default_port = option &gt;= 0 ? (option &amp; 0x0f) : 0;

    sp-&gt;phy[0] = eeprom[6];
    sp-&gt;phy[1] = eeprom[7];

    sp-&gt;mii_if.phy_id = eeprom[6] &amp; 0x1f;
    sp-&gt;mii_if.phy_id_mask = 0x1f;
    sp-&gt;mii_if.reg_num_mask = 0x1f;
    sp-&gt;mii_if.dev = dev;
    sp-&gt;mii_if.mdio_read = mdio_read;
    sp-&gt;mii_if.mdio_write = mdio_write;

    sp-&gt;rx_bug = (eeprom[3] &amp; 0x03) == 3 ? 0 : 1;
    if (((pdev-&gt;device &gt; 0x1030 &amp;&amp; (pdev-&gt;device &lt; 0x103F)))          || (pdev-&gt;device == 0x2449)
|| (pdev-&gt;device == 0x2459)
            || (pdev-&gt;device == 0x245D)) {
            sp-&gt;chip_id = 1;
    }

    if (sp-&gt;rx_bug)
        printk(KERN_INFO "  Receiver lock-up workaround activated.\n");

    /* The Speedo-specific entries in the device structure. */
    dev-&gt;open = &amp;speedo_open;
    dev-&gt;hard_start_xmit = &amp;speedo_start_xmit;
    netif_set_tx_timeout(dev, &amp;speedo_tx_timeout, TX_TIMEOUT);
    dev-&gt;stop = &amp;speedo_close;
    dev-&gt;get_stats = &amp;speedo_get_stats;
    dev-&gt;set_multicast_list = &amp;set_rx_mode;
    dev-&gt;do_ioctl = &amp;speedo_ioctl;
    SET_ETHTOOL_OPS(dev, &amp;ethtool_ops);
#ifdef CONFIG_NET_POLL_CONTROLLER
    dev-&gt;poll_controller = &amp;poll_speedo;
#endif

    if (register_netdevice(dev))
        goto err_free_unlock;
    rtnl_unlock();

    return 0;

err_free_unlock:
    rtnl_unlock();
    free_netdev(dev);
    return -1;
}

```

*speedo_found1()*: The kernel needs to know that this is an Ethernet device and it can use this new PCI device to
send/receive data over the network. For this, a device specific structure, *net_device*, is create and registered
*register_netdevice()*with the kernel. *net_device* contains the device name, it's MAC address, options
like full-duplex, interrupt number (IRQ) & pointers to functions for executing all the device functions.

Every ethernet device found should have a unique name and on linux ethernet devices are named eth0, eth1...eth100.
*dev_alloc_name()* allocates a name for this device and sets it in *net_device* structure.

Every 802.3 device has an unique 48-bit MAC address assigned to it. This address is not hardcoded in 82559, but is
stored by the board manufacturer in a non-volatile form, such as in the EEPROM or Flash EPROM outside 82559.

82559 expects the EEPROM format to be as shown below.

{% cimg /images/from-bits-to-waves/82559EEPROMFormat.jpg 82559 EEPROM Format %}

The 82559 automatically reads five words (0H, 1H, 2H, AH, and DH) from the EEPROM during bootup. The MAC address is
extracted from 0H, 1H &amp; 2H. The rest of the EEPROM map contains device options like type of connector, the device
type, PHY device ID etc.

*speedo_found1()* then proceeds to reset the 82559 chip using the PORT command (writing a zero value to the
SCBport, offset 8 in the CSR). The PORT commands is also used to self-test the 82559.

The kernel also needs to know what functions to call to open the device(*speedo_open*), transmit
(*speedo_start_xmit*), close/stop (*speedo_stop*), get stats (*speedo_get_stats*), do IOCTL
(*speedo_ioctl*). Notice that there is no receive function. This is because packets are received asynchronously.
When a new packet is received 82559 interrupts the kernel and the interrupt service routine handles the received packet
(more on this later). At this point the timer routines are also initialized.

This completes the initialization of 82559. The device is now ready to receive &amp; transmitt ethernet frames.


### Assigning an IP address to the device
After initializing the device, the device should be opened so that it is accessible from the IP layer. The device is
accessible from the outside world when an IP address is assigned to it. One way to assign an IP address to an interface
is throught the ifconfig program available from the net-utils.

The syntax to enable the device is:

*ifconfig eth0 up*

When asked to bring up the eth0 interface, ifconfig creates a generic raw TCP socket to the afinet address family and
issues a SIOCSIFFLAG ioctl to this raw socket. The flags set on the interface are the IFF_UP &amp; IFF_RUNNING.
``` c
/* ifconfig.c */

if (!strcmp(*spp, "up")) {
            goterr |= set_flag(ifr.ifr_name, (IFF_UP | IFF_RUNNING));
            spp++;
            continue;
}

/* Set a certain interface flag. */
static int set_flag(char *ifname, short flag)
{
    struct ifreq ifr;

    safe_strncpy(ifr.ifr_name, ifname, IFNAMSIZ);
    if (ioctl(skfd, SIOCGIFFLAGS, &amp;ifr) &lt; 0) {
        fprintf(stderr, _("%s: unknown interface: %s\n"),
                ifname, strerror(errno));
        return (-1);
    }
    safe_strncpy(ifr.ifr_name, ifname, IFNAMSIZ);
    ifr.ifr_flags |= flag;
    if (ioctl(skfd, SIOCSIFFLAGS, &amp;ifr) &lt; 0) {
        perror("SIOCSIFFLAGS");
        return -1;
    }
    return (0);
}
```
The userspace *ioctl()* system call is transformed to the *inet_ioctl()* defined in *af_inet.c*.
For *ifconfig* (or any interface-type ioctls) *inet_ioctl()* calls *devinet_ioctl()* function.
``` c
int devinet_ioctl(unsigned int cmd, void __user *arg)
{
    struct ifreq ifr;
    struct sockaddr_in sin_orig;
    struct sockaddr_in *sin = (struct sockaddr_in *)&amp;ifr.ifr_addr;
    struct in_device *in_dev;
    struct in_ifaddr **ifap = NULL;
    struct in_ifaddr *ifa = NULL;
    struct net_device *dev;
    char *colon;
    int ret = -EFAULT;
    int tryaddrmatch = 0;

    /*
     *  Fetch the caller's info block into kernel space
     */

    if (copy_from_user(&amp;ifr, arg, sizeof(struct ifreq)))
        goto out;
    ifr.ifr_name[IFNAMSIZ - 1] = 0;

    /* save original address for comparison */
    memcpy(&amp;sin_orig, sin, sizeof(*sin));

    colon = strchr(ifr.ifr_name, ':');
    if (colon)
        *colon = 0;

        ...

    switch(cmd) {

        ...

        case SIOCSIFADDR:   /* Set interface address (and family) */
    case SIOCSIFBRDADDR:    /* Set the broadcast address */
    case SIOCSIFDSTADDR:    /* Set the destination address */
    case SIOCSIFNETMASK:    /* Set the netmask for the interface */
        ret = -EACCES;
        if (!capable(CAP_NET_ADMIN))
            goto out;
        ret = -EINVAL;
        if (sin-&gt;sin_family != AF_INET)
            goto out;
        break;
    default:
        ret = -EINVAL;
        goto out;
    }

    rtnl_lock();

    ret = -ENODEV;
    if ((dev = __dev_get_by_name(ifr.ifr_name)) == NULL)
        goto done;

    if (colon)
        *colon = ':';

    if ((in_dev = __in_dev_get(dev)) != NULL) {
        if (tryaddrmatch) {
            /* Matthias Andree */
            /* compare label and address (4.4BSD style) */
            /* note: we only do this for a limited set of ioctls
               and only if the original address family was AF_INET.
               This is checked above. */
            for (ifap = &amp;in_dev-&gt;ifa_list; (ifa = *ifap) != NULL;
                 ifap = &amp;ifa-&gt;ifa_next) {
                if (!strcmp(ifr.ifr_name, ifa-&gt;ifa_label) &amp;&amp;
                    sin_orig.sin_addr.s_addr ==
                            ifa-&gt;ifa_address) {
                    break; /* found */
                }
            }
        }
        /* we didn't get a match, maybe the application is
           4.3BSD-style and passed in junk so we fall back to
           comparing just the label */
        if (!ifa) {
            for (ifap = &amp;in_dev-&gt;ifa_list; (ifa = *ifap) != NULL;
                 ifap = &amp;ifa-&gt;ifa_next)
                if (!strcmp(ifr.ifr_name, ifa-&gt;ifa_label))
                    break;
        }
    }

    ret = -EADDRNOTAVAIL;
    if (!ifa &amp;&amp; cmd != SIOCSIFADDR &amp;&amp; cmd != SIOCSIFFLAGS)
        goto done;

    switch(cmd) {
    ...
    case SIOCSIFADDR:   /* Set interface address (and family) */
        ret = -EINVAL;
        if (inet_abc_len(sin-&gt;sin_addr.s_addr) &lt; 0)           break;      if (!ifa) {             ret = -ENOBUFS;
if ((ifa = inet_alloc_ifa()) == NULL)               break;          if (colon)              memcpy(ifa-&gt;ifa_label,
ifr.ifr_name, IFNAMSIZ);
            else
                memcpy(ifa-&gt;ifa_label, dev-&gt;name, IFNAMSIZ);
        } else {
            ret = 0;
            if (ifa-&gt;ifa_local == sin-&gt;sin_addr.s_addr)
                break;
            inet_del_ifa(in_dev, ifap, 0);
            ifa-&gt;ifa_broadcast = 0;
            ifa-&gt;ifa_anycast = 0;
        }

        ifa-&gt;ifa_address = ifa-&gt;ifa_local = sin-&gt;sin_addr.s_addr;

        if (!(dev-&gt;flags &amp; IFF_POINTOPOINT)) {
            ifa-&gt;ifa_prefixlen = inet_abc_len(ifa-&gt;ifa_address);
            ifa-&gt;ifa_mask = inet_make_mask(ifa-&gt;ifa_prefixlen);
            if ((dev-&gt;flags &amp; IFF_BROADCAST) &amp;&amp;
                ifa-&gt;ifa_prefixlen &lt; 31)              ifa-&gt;ifa_broadcast = ifa-&gt;ifa_address |
                             ~ifa-&gt;ifa_mask;
        } else {
            ifa-&gt;ifa_prefixlen = 32;
            ifa-&gt;ifa_mask = inet_make_mask(32);
        }
        ret = inet_set_ifa(dev, ifa);
        break;
                ...
    }
done:
    rtnl_unlock();
out:
    return ret;
rarok:
    rtnl_unlock();
    ret = copy_to_user(arg, &amp;ifr, sizeof(struct ifreq)) ? -EFAULT : 0;
    goto out;
}

```
*devinet_ioctl()* fetches the user space defined *ifreq* structure containing the name of our interface
and the IP address to the kernel space. Based on the name of the interface (eth0, for e.g.), the device structure,
*net_device* (remember we created this in speedo_foun1() above?), is looked up [ *__dev_get_by_name()*].
The IP is set to this device by *inet_set_ifa()*.

### Shared Memory Communication Architecture
After initialization, 82559 is ready for its normal operation. As a Fast Ethernet Controller, its normal operation is to
transmit and receive data packets. As a PCI bus master device, 82559 works independently, without CPU intervention. The
CPU provides the 82559 with action commands and pointers to the data buffers that reside in host main memory. The 82559
independently manages these structures and initiates burst memory cycles to transfer data to and from main memory.

The CPU controls and examines 82559 via its control and status structures. Some of these control and status structures
reside within the 82559 and some reside in system memory. For transfer of data to/from the CPU, the 82559 establishes a
shared memory communication with the host CPU. This shared memory is divided into three parts:

- The Control/Status Registers (CSR)
- The Command Block List (CBL) or just Command List (CL)
- The Receive Frame Area (RFA).

The CSR resides on-chip and can be accessed by either I/O or memory cycles (after the PCI BIOS has mapped this region to
a region accessible by the CPU. See the section PCI Kernel Initialization), while the CBL and RFA reside in system
(host) memory.

Command Block List (CBL) is a linked list of commands to be executed by 82559. Receive Frame Area (RFA) is a linked list
of data structures that holds the received packets (frames).

{% cimg /images/from-bits-to-waves/82559SharedMemoryArchitecture_good.jpg 82559 Shared Memory Architecture %}

<h4>Controlling 82559 through CSR</h4>
The 82559 has seven Control/Status registers which make up the CSR space.

{% cimg /images/from-bits-to-waves/82559CSR.jpg 82559 Command/Status Registers (CSR) %}

The first 8 bytes of the CSR is called the System Control Block (SCB). The SCB serves as a central communication point
for exchanging control and status information between the host CPU and the 82559.

The CPU instructs the 82559 to Activate, Suspend, Resume or Idle the Command Unit (CU) or Receive Unit (RU) by placing
the appropriate control command in the CU or RU control field of SCB. Activating the CU causes the 82559 to begin
transmitting packets. When transmission is completed, the 82559 updates the SCB with the CU status then interrupts the
CPU, if configured to do so. Activating the RU causes the 82559 to go into the READY state for frame reception. When a
frame is received the RU updates the SCB with the RU status and interrupts the CPU.
### Command Block List (CBL) and Transmitted Frame
Transmit or configure commands issued by CPU are wrapped inside what are called Command Blocks (CB). These command
blocks are chained together to form the CBL.

{% cimg /images/from-bits-to-waves/82559ActionCommand.jpg Action Command %}

Action commands are categorized into two types:


- Non-Tx commands: This category includes commands such as NOP, Configure, IA Setup, Multicast Setup, Dump and Diagnose.
- Tx command: This command causes the 82559 to transmit a frame. A transmit command block contains (in the parameter
  field) the destination address, length of the transmitted frame and a pointer to buffer area in memory containing the
data portion of the frame. The data field is contained in a memory data structure consisting of a buffer descriptor (BD)
and a data buffer, or a linked list of buffer descriptors and buffers (as shown in figure below).

{% cimg /images/from-bits-to-waves/82559DataBuffer.jpg Data buffer %}

When eepro100 is ready to transmit a packet, it must create this Tx command block and send it to 82559. This Tx Command
block is a structure called TxFD (Transmit Frame Descriptor).
``` c
struct TxFD {                    /* Transmit frame descriptor set. */
    s32 status;
    u32 link;                    /* void * */
    u32 tx_desc_addr;            /* Always points to the tx_buf_addr element. */
    s32 count;                    /* # of TBD (=1), Tx start thresh., etc. */
    /* This constitutes two "TBD" entries -- we only use one. */
#define TX_DESCR_BUF_OFFSET 16
    u32 tx_buf_addr0;            /* void *, frame to be transmitted.  */
    s32 tx_buf_size0;            /* Length of Tx frame. */
    u32 tx_buf_addr1;            /* void *, frame to be transmitted.  */
    s32 tx_buf_size1;            /* Length of Tx frame. */
    /* the structure must have space for at least CONFIG_DATA_SIZE starting
    * from tx_desc_addr field */
};
```
This TxFD can hold one TxCB and two Tx Buffer Descriptors (TxBD). During eepro100 initialization
(*speedo_found1()</em), a fixed number of these TxFD's are created and linked together into a ring
(*tx_ring_space*). When new data is available for transmission, one of the TxFD is fetched from the ring and sent
to 82559 for transmission.

The status field of TxFD is a bit array and can contain any of:
``` c
/* Commands that can be put in a command list entry. */
enum commands {
    CmdNOp = 0, CmdIASetup = 0x10000, CmdConfigure = 0x20000,
    CmdMulticastList = 0x30000, CmdTx = 0x40000, CmdTDR = 0x50000,
    CmdDump = 0x60000, CmdDiagnose = 0x70000,
    CmdSuspend = 0x40000000,    /* Suspend after completion. */
    CmdIntr = 0x20000000,        /* Interrupt after completion. */
    CmdTxFlex = 0x00080000,        /* Use "Flexible mode" for CmdTx command. */
};
```

### Receive Frame Area
To reduce CPU overhead, the 82559 is designed to receive frames without CPU supervision. The host CPU first sets aside
an adequate receive buffer space and then enables the 82559 Receive Unit (This is done in *speedo_init_rx_ring*
when the device is opened: *speedo_open*). Once enabled, the RU watches for arriving frames and automatically
stores them in the Receive Frame Area (RFA).

The RFA contains Receive Frame Descriptors, Receive Buffer Descriptors, and Receive Buffers (see figure below).

{% cimg /images/from-bits-to-waves/82559FlexibleReceiveStructure1.jpg Flexible Receive Structure %}

The individual Receive Frame Descriptors make up a Receive Descriptor List (RDL) used by the 82559 to store the
destination and source addresses, the length field, and the status of each frame received.

{% cimg /images/from-bits-to-waves/82559ReceiveFrameDescriptor.jpg Receive Frame Descriptor %}

eepro100 representation of the Receive Frame Descriptor (RxFD):
``` c

struct RxFD {                    /* Receive frame descriptor. */
    volatile s32 status;
    u32 link;                    /* struct RxFD * */
    u32 rx_buf_addr;            /* void * */
    u32 count;
} RxFD_ALIGNMENT;

/* Selected elements of the Tx/RxFD.status word. */
enum RxFD_bits {
    RxComplete=0x8000, RxOK=0x2000,
    RxErrCRC=0x0800, RxErrAlign=0x0400, RxErrTooBig=0x0200, RxErrSymbol=0x0010,
    RxEth2Type=0x0020, RxNoMatch=0x0004, RxNoIAMatch=0x0002,
    TxUnderrun=0x1000,  StatusComplete=0x8000,
};
```

## Data Transmission
An application calls *write(socket, data, length)* system call to write to an open socket. In the kernel,
*inet_sendmsg()* is executed with a pointer to the sock structure. *inet_sendmsg()* calls the send
operation of the corresponding transport protocol which for TCP is *tcp_sendmsg()*. *tcp_sendmsg()* copies
the data to be transmitted from the user space to the socket and starts the transmit process by calling
*tcp_send_skb()* and subsequently *tcp_transmitt_skb()*. *tcp_transmitt_skb()* adds the TCP Header
to the packet, calculate the TCP checksum and call the *ip_queue_xmit()*. Determining the ip route and
construction of the IP header happens in *ip_queue_xmit()*. Finally the MAC address is copied to the packet and
*dev_queue_xmit()* is called to send the packet to the ethernet device.

*dev_queue_xmit()* points to a driver specific function. In case of eepro100, this function is
*speedo_start_xmit()* (remember we set this in *speedo_found1()*?).
``` c
static int
speedo_start_xmit(struct sk_buff *skb, struct net_device *dev)
{
    struct speedo_private *sp = netdev_priv(dev);
    void __iomem *ioaddr = sp-&gt;regs;
    int entry;

    /* Prevent interrupts from changing the Tx ring from underneath us. */
    unsigned long flags;

    spin_lock_irqsave(&amp;sp-&gt;lock, flags);

    /* Check if there are enough space. */
    if ((int)(sp-&gt;cur_tx - sp-&gt;dirty_tx) &gt;= TX_QUEUE_LIMIT) {
        printk(KERN_ERR "%s: incorrect tbusy state, fixed.\n", dev-&gt;name);
        netif_stop_queue(dev);
        sp-&gt;tx_full = 1;
        spin_unlock_irqrestore(&amp;sp-&gt;lock, flags);
        return 1;
    }

    /* Calculate the Tx descriptor entry. */
    entry = sp-&gt;cur_tx++ % TX_RING_SIZE;

    sp-&gt;tx_skbuff[entry] = skb;
    sp-&gt;tx_ring[entry].status =
        cpu_to_le32(CmdSuspend | CmdTx | CmdTxFlex);
    if (!(entry &amp; ((TX_RING_SIZE&gt;&gt;2)-1)))
        sp-&gt;tx_ring[entry].status |= cpu_to_le32(CmdIntr);
    sp-&gt;tx_ring[entry].link =
        cpu_to_le32(TX_RING_ELEM_DMA(sp, sp-&gt;cur_tx % TX_RING_SIZE));
    sp-&gt;tx_ring[entry].tx_desc_addr =
        cpu_to_le32(TX_RING_ELEM_DMA(sp, entry) + TX_DESCR_BUF_OFFSET);
    /* The data region is always in one buffer descriptor. */
    sp-&gt;tx_ring[entry].count = cpu_to_le32(sp-&gt;tx_threshold);
    sp-&gt;tx_ring[entry].tx_buf_addr0 =
        cpu_to_le32(pci_map_single(sp-&gt;pdev, skb-&gt;data,
                    skb-&gt;len, PCI_DMA_TODEVICE));
    sp-&gt;tx_ring[entry].tx_buf_size0 = cpu_to_le32(skb-&gt;len);

    /* workaround for hardware bug on 10 mbit half duplex */

    if ((sp-&gt;partner == 0) &amp;&amp; (sp-&gt;chip_id == 1)) {
        wait_for_cmd_done(dev, sp);
        iowrite8(0 , ioaddr + SCBCmd);
        udelay(1);
    }

    /* Trigger the command unit resume. */
    wait_for_cmd_done(dev, sp);
    clear_suspend(sp-&gt;last_cmd);
    /* We want the time window between clearing suspend flag on the previous
    command and resuming CU to be as small as possible.
    Interrupts in between are very undesired.  --SAW */
    iowrite8(CUResume, ioaddr + SCBCmd);
    sp-&gt;last_cmd = (struct descriptor *)&amp;sp-&gt;tx_ring[entry];

    /* Leave room for set_rx_mode(). If there is no more space than reserved
    for multicast filter mark the ring as full. */
    if ((int)(sp-&gt;cur_tx - sp-&gt;dirty_tx) &gt;= TX_QUEUE_LIMIT) {
        netif_stop_queue(dev);
        sp-&gt;tx_full = 1;
    }

    spin_unlock_irqrestore(&amp;sp-&gt;lock, flags);

    dev-&gt;trans_start = jiffies;

    return 0;
}

```
*speedo_start_xmit()* inserts any data received from the kernel (skb) into the Tx ring. If there are no open
slots in the Tx ring, *netif_stop_queue()* is called to request the kernel to stop sending more packets from the
upper layers and flag the Tx ring as full. The new skb (data) to be transmitted is inserted as the data portion of a
TxFD at *tx_buf_addr0* (See TxFD above).

The TxFD status of this entry is set to *CmdSuspend* (suspend after completion), *CmdTx* and
*CmdFlex* (flexible transmission mode). The last command inserted into the Tx ring has the *CmdSuspend*
bit set so that the CU is suspended immediately after the last command is executed. This way we prevent any erroneous
data from being transmitted. We have to clear the *CmdSuspend* from the previous command already in the Tx ring
before doing this. If the Tx ring is more than half full, we also set *CmdIntr* (interrupt after completion). The
causes the chip to generates an interrupt after executing this command. When an interrupt is received after transmit
completes, the interrupt handler calls *speedo_tx_buffer_gc()* to clean up completed and erroneous skb from the
Tx ring.

Finally, we activate the CU to transmit this new packet by issuing *CmdResume* to SCB.

### Generating the Ethernet Frame
The final ethernet frame sent over the wire is:

{% cimg /images/from-bits-to-waves/EthernetFrameFormat.jpg Ethernet Frame Format %}

82559 automatically generates the preamble (alternating 1s and 0s) and start frame delimiter, fetches the destination
address and length field from the Transmit command, inserts its unique MAC address (that it fetched from the external
Flash/EEPROM) as the source address, fetches the data field specified by the Transmit command, and computes and appends
the CRC to the end of the frame.

This final frame is then handed over to the PHY layer for transmission over the wire.

### Bits to Waves
82559 has an internal 82555 Physical Layer Interface (PHY). It is responsible for connecting the 82559 to the actual
physical wire over which the data will be carried. PHY converts the incoming digital data to analog signals during
transmission and analog signals to digital data during reception.

<h4>Signal Transmission</h4>
To achieve a high transfer rate (upto 125Mbps), two tasks must be performed to the data before it is transmitted over
the wire:

- scrambling/descrambling
- encoding/decoding

{% cimg /images/from-bits-to-waves/100BaseTxPHYModule.jpg PHY Module %}

<h4>Scrambling/Descrambling</h4>
All data transmitted and received over wire are synchronized with a clock. To keep the receiver in sync with the
transmitter, the clock signals have to be embedded in the signal transmitted over the wire itself. The robustness of
this digitally transmitted synchronization signal often depends on the statistical nature of the data being transmitted.
For example, long strings of 0’s and 1’s can cause loss of the synchronization since the receiver clock is derived from
the received data. Therefore, data must contain adequate transitions to assure that the timing recovery circuit at the
receiver will stay in synchronization. Scrambling (randomizing) the data over a period of time spreads these patterns.

<h4>Encoding/Decoding</h4>
There are different ways to represent the digital 1 &amp; 0 over the wire. The most widely used is Non-Return to Zero
(NRZI) format. NRZI, is a two level unipolar code (0 and V) representing a "one" by a transition between two levels and
a "zero" is represented by no transition as shown in the figure below. Another format is MLT-3. MLT-3 is a three level
eenting a "one" by a transition between two levels and "zero" as no transition as shown in figure below. MLT-3 has the
advantage that the maximum fundamental frequency of MLT-3 is one-half that of NRZI. With the MLT-3 coding scheme, 90% of
the spectral energy is below 40MHz versus 70MHz for NRZI. Thus we can achieves the same data rate as NRZI, but do not
require a wideband transmission medium. The work of the encoder/decoder is to convert between NRZI and MLT-3.

{% cimg /images/from-bits-to-waves/BitsOnWire.jpg Bits on Wire %}

Finally, the MLT-3 encoded data is transmitted over the wire. It is important to isolate the the PHY from the CAT-5
Ethernet cable for load balancing and also feedback. This is done by using specialized Ethernet magnetics with each side
of the transformer referenced to the appropriate ground.

{% cimg http://interviewquestions.pupilgarage.com/images/EC%20Images/EC_Fig03.gif PHY to Magnetics interface %}


<h4>Signal Reception</h4>
Once the PHY detects signals on the receive side, it decodes and descrambles it to reconstruct the data transmitted by
the receiver.

<h4>Receiving Frames</h4>
To reduce CPU overhead, the 82559 is designed to receive frames without CPU supervision. The eepro100 had already setup
the address of the receive buffer ring in the SCB as part of initialization. Once the 82559 receive unit (RU) is
enabled, the RU watches for arriving frames and automatically stores them in the Rx ring / Receive Frame Area (RFA). The
RFA contains Receive Frame Descriptors, Receive Buffer Descriptors, and Data Buffers (see Figure 2). The individual
Receive Frame Descriptors make up a Receive Descriptor List (RDL) used by the 82559 to store the destination and source
addresses, the length field, and the status of each frame received.

{% cimg /images/from-bits-to-waves/82559FlexibleReceiveStructure.jpg Flexible Receive Structure %}

82559 checks each passing frame for an address match. The 82559 will recognize its own unique address, one or more
multicast addresses, or the broadcast address. If a match is found, 82559 stores the destination address, source
addresses and the length field in the next available Receive Frame Descriptor (RFD). It then begins filling the next
available Data Buffer on the Receive Buffer Descriptor (RBD). As one Data Buffer is filled, the 82559 automatically
fetches the next Data Buffer &amp; RBD until the entire frame is received.

Once the entire frame is received without error, a frame received interrupt status bit is posted in the SCB and an
interrupt is sent to the CPU.

The interrupt handler (*speedo_interrupt()*) checks if the receive interrupt bit is set in SCB and calls
*speedo_rx()* to handle the received packet.

``` c
static int
speedo_rx(struct net_device *dev)
{
    struct speedo_private *sp = netdev_priv(dev);
    int entry = sp-&gt;cur_rx % RX_RING_SIZE;
    int rx_work_limit = sp-&gt;dirty_rx + RX_RING_SIZE - sp-&gt;cur_rx;
    int alloc_ok = 1;
    int npkts = 0;

    if (netif_msg_intr(sp))
        printk(KERN_DEBUG " In speedo_rx().\n");
    /* If we own the next entry, it's a new packet. Send it up. */
    while (sp-&gt;rx_ringp[entry] != NULL) {
        int status;
        int pkt_len;

        pci_dma_sync_single_for_cpu(sp-&gt;pdev, sp-&gt;rx_ring_dma[entry],
                                    sizeof(struct RxFD), PCI_DMA_FROMDEVICE);
        status = le32_to_cpu(sp-&gt;rx_ringp[entry]-&gt;status);
        pkt_len = le32_to_cpu(sp-&gt;rx_ringp[entry]-&gt;count) &amp; 0x3fff;

        if (!(status &amp; RxComplete))
            break;

        if (--rx_work_limit &lt; 0)             break;         /* Check for a rare out-of-memory case: the current
buffer is         the last buffer allocated in the RX ring.  --SAW */         if (sp-&gt;last_rxf ==
sp-&gt;rx_ringp[entry]) {
            /* Postpone the packet.  It'll be reaped at an interrupt when this
            packet is no longer the last packet in the ring. */
            if (netif_msg_rx_err(sp))
                printk(KERN_DEBUG "%s: RX packet postponed!\n",
                    dev-&gt;name);
            sp-&gt;rx_ring_state |= RrPostponed;
            break;
        }

        if (netif_msg_rx_status(sp))
            printk(KERN_DEBUG "  speedo_rx() status %8.8x len %d.\n", status,
                pkt_len);
        if ((status &amp; (RxErrTooBig|RxOK|0x0f90)) != RxOK) {
            if (status &amp; RxErrTooBig)
                printk(KERN_ERR "%s: Ethernet frame overran the Rx buffer, "
                    "status %8.8x!\n", dev-&gt;name, status);
            else if (! (status &amp; RxOK)) {
                /* There was a fatal error.  This *should* be impossible. */
                sp-&gt;stats.rx_errors++;
                printk(KERN_ERR "%s: Anomalous event in speedo_rx(), "
                    "status %8.8x.\n",
                    dev-&gt;name, status);
            }
        } else {
            struct sk_buff *skb;

            /* Check if the packet is long enough to just accept without
            copying to a properly sized skbuff. */
            if (pkt_len &lt; rx_copybreak                 &amp;&amp; (skb = dev_alloc_skb(pkt_len + 2)) != 0) {
skb-&gt;dev = dev;
                skb_reserve(skb, 2);    /* Align IP on 16 byte boundaries */
                /* 'skb_put()' points to the start of sk_buff data area. */
                pci_dma_sync_single_for_cpu(sp-&gt;pdev, sp-&gt;rx_ring_dma[entry],
                                            sizeof(struct RxFD) + pkt_len,
                                            PCI_DMA_FROMDEVICE);

#if 1 || USE_IP_CSUM
                /* Packet is in one chunk -- we can copy + cksum. */
                eth_copy_and_sum(skb, sp-&gt;rx_skbuff[entry]-&gt;tail, pkt_len, 0);
                skb_put(skb, pkt_len);
#else
                memcpy(skb_put(skb, pkt_len), sp-&gt;rx_skbuff[entry]-&gt;tail,
                    pkt_len);
#endif
                pci_dma_sync_single_for_device(sp-&gt;pdev, sp-&gt;rx_ring_dma[entry],
                                            sizeof(struct RxFD) + pkt_len,
                                            PCI_DMA_FROMDEVICE);
                npkts++;
            } else {
                /* Pass up the already-filled skbuff. */
                skb = sp-&gt;rx_skbuff[entry];
                if (skb == NULL) {
                    printk(KERN_ERR "%s: Inconsistent Rx descriptor chain.\n",
                        dev-&gt;name);
                    break;
                }
                sp-&gt;rx_skbuff[entry] = NULL;
                skb_put(skb, pkt_len);
                npkts++;
                sp-&gt;rx_ringp[entry] = NULL;
                pci_unmap_single(sp-&gt;pdev, sp-&gt;rx_ring_dma[entry],
                                PKT_BUF_SZ + sizeof(struct RxFD),
                                PCI_DMA_FROMDEVICE);
            }
            skb-&gt;protocol = eth_type_trans(skb, dev);
            netif_rx(skb);
            dev-&gt;last_rx = jiffies;
            sp-&gt;stats.rx_packets++;
            sp-&gt;stats.rx_bytes += pkt_len;
        }
        entry = (++sp-&gt;cur_rx) % RX_RING_SIZE;
        sp-&gt;rx_ring_state &amp;= ~RrPostponed;
        /* Refill the recently taken buffers.
        Do it one-by-one to handle traffic bursts better. */
        if (alloc_ok &amp;&amp; speedo_refill_rx_buf(dev, 0) == -1)
            alloc_ok = 0;
    }

    /* Try hard to refill the recently taken buffers. */
    speedo_refill_rx_buffers(dev, 1);

    if (npkts)
        sp-&gt;last_rx_time = jiffies;

    return 0;
}

```

The receive is a very simple process as most of the work is handled by the 82559 chip. 82559 while storing the packet on
the Rx ring has already determined the size of the packet, it stores this along with other relevent information like the
receive status in the Rx buffer. *speedo_rx()* checks the status to make sure there were no errors in receiving
the frame.

The driver receives packets into full-sized buffers - 1560 bytes. When a packet comes in, the driver needs to make a
decision. Does it use the whole 1560 bytes for this packet, or does it allocate a smaller buffer on-the-fly and copy the
data into it? If the size of the frame received is smaller than the *rx_copybreak*, then a new buffer is
allocated and the data is copied into it. If the packet is larger than *rx_copybreak*, we remove the received
skbuff (leaving a hole in the Rx ring) and pass this buffer to the higher applications. We later call
*speedo_refill_rx_buffers()* to refill the hole in the Rx ring.

The type of protocol of this packet is determined by calling *eth_type_trans()*. The packet is then queued for
the upper layers to process using the *netif_rx()*. Finally we refill the buffer we just took out of the Rx ring.

### References
- <a href="http://pcmcia-cs.sourceforge.net/specs/i82555.pdf" title="Intel 82555" target="_blank">Intel 82555 10/100
  Mbps LAN Physical Layer Interface</a>
- <a href="http://www.intel.com/content/www/us/en/ethernet-controllers/82559er-fast-ethernet-pci-datasheet.html"
  title="Intel 82559 Fast Ethernet Controller Datasheet" target="_blank">Intel 82559 Fast Ethernet PCI Controller Data
Sheet</a>
- <a href="http://www.intel.com/content/www/us/en/ethernet-controllers/8255x-10-100-mbps-ethernet-controller-software-dev-manual.html"
title="Intel 8255X 10/100 Mbps Ethernet Controller Family Open Source Manual " target="_blank">Intel 8255X 10/100 Mbps
Ethernet Controller Family Open Source Manual </a>
- <a href="http://lxr.linux.no/#linux-bk+v2.6.11.5/drivers/net/eepro100.c" title="eepro100.c Linux Device Driver"
  target="_blank">eepro100.c Linux Device Driver</a>

