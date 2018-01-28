import React from 'react';
import React3 from 'react-three-renderer';
import THREE from 'three';
import Ground from '../Ground/Ground';
import Fountain from '../Fountain/Fountain';
import MA from 'moving-average';

let AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)();

class Packscape extends React.Component {
    /**
     * Our main packscape React compoenent.  This defines our main scene,
     * camera, lights, ground geometry, and per-packet-layer fountains.
     */
    constructor(props, context) {
        super(props, context);

        this.state = {
            packetCounts: {},
            frame: 0
        };
        
        // Emitter that we'll receive new packet count information from.
        this.dumplingEmitter = props.dumplingEmitter;
        this.dumplingEmitter.on('PacketCountChef', this._dumplingHandler.bind(this));

        this.cameraPosition = new THREE.Vector3(0, 1200, 200);
        this.cameraLookAt = new THREE.Vector3(0, 0, 0);

        this._onAnimate = () => {
            // Update camera position.
            this.cameraPosition.x = Math.sin(this.state.frame * .003) * 10;
            this.cameraPosition.y = 1200 + Math.cos(this.state.frame * .005) * 150;
            let newFrame = this.state.frame + 1;
            this.setState({frame: newFrame});
        };
        
        this.audioContext = AUDIO_CONTEXT;
        
        let gain = this.audioContext.createGain();
        gain.gain.value = 1;

        let convolver = this.effect();
        convolver.connect(gain);

        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.value = 220;
        this.oscillator.detune.value = 0;
        this.oscillator.connect(convolver);
        this.oscillator.start(0);

        gain.connect(this.audioContext.destination);
        
        //this.oscillator = props.oscillator;
        //this.audioCtx = props.audioContext;
        this.packetMA = MA(30 * 1000);     // 30 seconds
        this.packetsReceived = 0;
        this.packetRate = 1;
    }
    
    _dumplingHandler(dumpling) {
        /**
         * Receives a dumpling (from nd-shifty, presumably from a
         * PacketCountChef).  We adjust the packet layer names to be more
         * readable and then use it to reset our state.
         */
        
        // Shorten the packet layer names, keeping only whatever is after
        // the last hyphen (if there is one).  This is an accuracy vs.
        // readability tradeoff.
        let counts = {};
        for (let layer in dumpling.packet_counts) {
            counts[layer.split('-').pop().trim()] = dumpling.packet_counts[layer];
        }

        // Determine how many new packets we have.
        let packetCount = Object.keys(counts).reduce((a, b) => a + counts[b], 0);
        if (this.packetsReceived > 0) {
            let newPackets = packetCount - this.packetsReceived + 1;
            this.packetMA.push(Date.now(), newPackets);
            this.packetRate = newPackets / this.packetMA.movingAverage();
            let oscFreq = Math.round(220 * this.packetRate);
            oscFreq = Math.min(Math.max(oscFreq, 110), 880);
            this.oscillator.frequency.linearRampToValueAtTime(
                oscFreq, this.audioContext.currentTime + 3);
        }
        this.packetsReceived = packetCount;
        
        this.setState({
            packetCounts: counts
        });
    }

    effect() {
        var convolver = this.audioContext.createConvolver();
        var noiseBuffer = this.audioContext.createBuffer(
                2, 0.5 * this.audioContext.sampleRate, this.audioContext.sampleRate);
        var left = noiseBuffer.getChannelData(0);
        var right = noiseBuffer.getChannelData(1);
        
        for (var i = 0; i < noiseBuffer.length; i++) {
            left[i] = Math.random() * 2 - 1;
            right[i] = Math.random() * 2 - 1;
        }
        
        convolver.buffer = noiseBuffer;
        
        return convolver;
    }

    render() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Create a fountain for each network packet layer.  Each fountain is
        // placed equidistant on a circle.
        const packetCounts = this.state.packetCounts;

        // Determine fountain position.
        let fountainCount = Object.keys(packetCounts).length;
        let segmentLength = (Math.PI * 2) / fountainCount;
        let fountainIndex = 0;
        let fountainsCircleRadius = 400;
        
        let fountains = Object.keys(packetCounts).sort().map((packetLayer) => {
            let fountainPosition = new THREE.Vector3(
                Math.round(fountainsCircleRadius * Math.cos(segmentLength * fountainIndex)),
                0,
                Math.round(fountainsCircleRadius * Math.sin(segmentLength * fountainIndex))
            );

            fountainIndex++;

            return (
                <Fountain
                    key={packetLayer}
                    dumplingEmitter={this.dumplingEmitter}
                    position={fountainPosition}
                    layerName={packetLayer}
                    packetCount={this.state.packetCounts[packetLayer]}
                    audioContext={this.audioContext}
                />
            );
        });
        
        // Create a new vector for our camera position.
        let currentCamPos = new THREE.Vector3(
            this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z);

        return (
            <div>
                <div style={{position: 'absolute', color: '#ffffff', padding: 10}}>giggity</div>
            <React3
                mainCamera="camera"
                width={width}
                height={height}
                shadowMapEnabled={true}
                antialias={true}
                onAnimate={this._onAnimate}
            >
                <scene fog={new THREE.Fog("#303030", 300, 2000)}>
                    <perspectiveCamera
                        name="camera"
                        fov={50}
                        aspect={width / height}
                        near={0.1}
                        far={5000}
                        position={currentCamPos}
                        lookAt={this.cameraLookAt}
                    />
                    <ambientLight
                        color={new THREE.Color(0.25, 0.25, 0.45)}
                    />
                    <pointLight
                        position={new THREE.Vector3(0, 250, 0)}
                        color={new THREE.Color(.5, 1, .5)}
                        castShadow={true}
                        intensity={1}
                        distance={0}
                        decay={0}
                        shadowMapWidth={1024}
                        shadowMapHeight={1024}
                    />
                    <pointLight
                        position={new THREE.Vector3(2000, 500, -2000)}
                        color={new THREE.Color(1, 1, 1)}
                        castShadow={false}
                        intensity={.9}
                        distance={0}
                        decay={0}
                    />
                    <pointLight
                        position={new THREE.Vector3(-2000, 500, 2000)}
                        color={new THREE.Color(1, 1, 1)}
                        castShadow={false}
                        intensity={.9}
                        distance={0}
                        decay={0}
                    />
                    <Ground />
                    {fountains}
                </scene>
            </React3>
            </div>
        );
    }
}


export default Packscape;
