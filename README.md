packscape
=========

Visualize your network packet layers as odd-looking 3D fountain things inside your web browser.

Each layer (Ethernet, TCP, UDP, DNS, etc) gets its own fountain, and each network packet from each layer gets hurled out of its fountain somewhat like a very square blob of colored water.  What it lacks in technical accuracy it makes up for with CPU cycles expended.

packscape uses [NetDumplings](https://github.com/mjoblin/netdumplings) to retrieve the network packet data, and [three.js](https://github.com/mrdoob/three.js) and [react-three-renderer](https://github.com/toxicFork/react-three-renderer) for rendering.

Here's what it looks like (excuse the crazy banding; that's just the gif having trouble with all the shades of green):

![packscape example](/../screenshots/sreenshots/packscape.gif?raw=true "packscape example")

### Installation

First [install NetDumplings](https://netdumplings.readthedocs.io/en/latest/pages/installation.html) (note this requires Python 3.5, and you also need administrator privileges for the packet sniffer to function).  Once NetDumplings is installed you need to run it with the single `PacketCountChef`:

```
# Start nd-shifty, which funnels data from nd-snifty to the visualizer.
terminal-1$ nd-shifty

# Start nd-snifty, the network packet sniffer.
terminal-2$ nd-snifty --kitchen packets_per_second

# Start nd-printer to confirm you're getting packet data.
terminal-3$ nd-printer --chef PacketCountChef
```

(The `terminal-3` command is optional, but running `nd-printer` is useful to confirm that you're getting valid packet counts off your network).

Now you can install and run the visualizer (a *dumpling eater* if you speak NetDumpling):

```
$ git clone https://github.com/mjoblin/packscape.git
$ cd packscape

$ npm install
$ npm start
$ open http://localhost:3000
```

### Notes

#### What's going on here?

* Each network packet layer gets its own fountain.
* For every network packet, if that packet contains a specific layer then that layer's fountain will emit a particle.
* Each fountain has a random color.
* If a layer hasn't appeared in any packets for over 10 seconds then that layer's fountain is greyed out and its base stops spinning.
* Each fountain's base spins faster or slower depending on how many packets currently contain that layer (compared to the average over the past 5 minutes).

#### Some cautions

* This has only been tested on a Mac.
* Although you should be able to run the NetDumplings scripts and the visualizer on different computers, it's probably easiest to initally run them on the same host.
* You may need a computer that has enough moxy (and a modern browser) to adequately power the 3D side of things.
* It will almost certainly slow down if you have lots of active packets on your network.
* The visualizer limits the number of particles per fountain and there's no normalization done to allow for more packets, so results may not be awesome on high-throughput networks.
* The fountains might get cramped if you have loads of packet layers.

