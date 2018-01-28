import React from 'react';
import THREE from 'three';
import {easeQuadInOut} from 'd3-ease';
import TextLabel from '../TextLabel/TextLabel';
import MA from 'moving-average';


class Fountain extends React.Component {
    /**
     * Defines a fountain component.  A fountain is a simple particle system
     * which attempts to visualize packets as fountain droplets.  Whenever a
     * new packet count is received, that many droplets is added to the
     * fountain for animation.  The more packets that come in (every second),
     * the more active the fountain.  The fountain base spins at a speed which
     * attempts to somewhat reflect the current rate of packets coming in
     * and whether that rate seems higher or lower than average.
     * 
     * @param props
     * @param context
     */
    constructor(props, context) {
        super(props, context);
        
        this.layerName = props.layerName;

        // Record the last time we received new packets.
        this.whenLastPacketSeen = Date.now();
        
        // We get packet updates every second.
        this.sampleFrequency = 1000;
        
        // How long to not receive packets before we consider the fountain to
        // be dead.  Dead fountains come back to life when new packets arrive.
        this.deathDuration = 10000;
        
        // Maintain two moving averages.  We use this to track the average rate
        // that packets are arriving into the fountain.
        this.shortMovingAverage = MA(5 * 1000);     // 5 seconds
        this.longMovingAverage = MA(5 * 60 * 1000); // 5 minutes

        // The rate at which we're receiving packets.  1 means normal (given
        // the average over time); and <1 and >1 means slower and faster than
        // normal (the smaller the slower, and the larger the faster).
        this.packetRate = 1;

        this.state = {
            alive: false,
        };
        
        this.color = new THREE.Color(
            Math.random(), Math.random(), Math.random());
        
        this.particleConfig = {
            packetCount: null,
            particleCount: 1000,
            releaseDurationMS: 950,
            percentThroughReleaseCycle: 0,
            prevTCPCount: 0,
            particlesToRelease: 0,
            particlesReleased: 0,
            releasing: false,
            releaseStart: null
        };
        
        // Array of particles.  This array gets reused over the entire
        // lifetime of the fountain (individual particles get released and
        // then reused as required).
        this.particles = [];
        
        // Initialize our particle array.
        for (let i = 0; i < this.particleConfig.particleCount; i++) {
            this.particles.push(this._generateParticle());
        }

        // The current number of packets seen in this layer.  Assumed to
        // always increase over time.
        this.packetCount = null;

        // Current y-rotation of the fountain base geometry.
        this.y = 0;
        
        let x = props.position.x;
        let y = props.position.y;
        let z = props.position.z;

        // We maintain three position vectors.  currentPosition is the
        // current position of the fountain (which may or may not be in the
        // middle of a move.  When moving, newPosition is the destination
        // position and oldPosition is the starting position.
        this.positionConfig = {
            oldPosition: new THREE.Vector3(x, y, z),
            newPosition: new THREE.Vector3(x, y, z),
            currentPosition: new THREE.Vector3(x, y, z),
            moveStart: null,
            moveDuration: 5000,
        };
        
        this.audioContext = props.audioContext;
        let gain = this.audioContext.createGain();
        gain.gain.value = 0.003;
        gain.connect(this.audioContext.destination);
        this.audioOutput = gain;
        
        this.audioBuffer = false;
    }

    componentWillMount() {
        this.intervalID = window.setInterval(
            this._processInterval.bind(this), this.sampleFrequency);

        this._getAudioData();
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }
    
    _processInterval() {
        /**
         * Check at regular intervals whether it's been long enough since we
         * last received a packet to consider this fountain dead.  Fountains
         * will come back to life when new packets come in.
         */
        if (Date.now() > (this.whenLastPacketSeen + this.deathDuration)) {
            this.setState({alive: false});
        }
    }
    
    _determineCurrentPosition() {
        /**
         * A Fountain might be asked to move from one position on the circle
         * to another (to make more room for new fountains).  This method
         * detects requests to move (via a new props.position) and tracks
         * in-progress moves.
         */
        let reqPos = this.props.position;

        let config = this.positionConfig;
        let newPos = config.newPosition;
        let oldPos = config.oldPosition;
        let curPos = config.currentPosition;

        if ((reqPos.x !== newPos.x) || (reqPos.z !== newPos.z)) {
            // We've been requested to move to a new position.
            config.oldPosition = new THREE.Vector3(newPos.x, newPos.y, newPos.z);
            newPos.x = reqPos.x;
            newPos.z = reqPos.z;
            config.moveStart = Date.now();
        }

        if ((curPos.x !== newPos.x) || (curPos.z !== newPos.z)) {
            // We're in the middle of a move from the old position to the
            // new position.
            let moveProgress = (Date.now() - config.moveStart) / config.moveDuration;
            if (moveProgress >= 1) {
                curPos.x = newPos.x;
                curPos.z = newPos.z;
            }
            else {
                curPos.x = oldPos.x + ((newPos.x - oldPos.x) *
                    easeQuadInOut(moveProgress));
                curPos.z = oldPos.z + ((newPos.z - oldPos.z) *
                    easeQuadInOut(moveProgress));
            }
        }
    }
    
    _processNewPackets(newPacketCount) {
        /**
         * Process a new batch of incoming packets.  This entails preparing
         * particles (which represent those packets) for animation; as well as
         * maintaining some moving averages for the packet rate.
         * 
         * @type {number} The number of new packets which have arrived.
         */
        // Retrieve new total packets from props.
        this.packetCount = this.props.packetCount;
        
        // Track when we last received new packets.
        this.whenLastPacketSeen = Date.now();
        
        // Set some particle config settings to manage the particle release.
        this.particleConfig.particlesToRelease = newPacketCount;
        this.particleConfig.particlesReleased = 0;
        this.particleConfig.releasing = true;
        this.particleConfig.releaseStart = Date.now();
        
        // Add this packet count to our moving-average trackers.
        this.shortMovingAverage.push(Date.now(), newPacketCount);
        this.longMovingAverage.push(Date.now(), newPacketCount);

        // Compute the incoming packet rate (1 is normal, <1 is slower than
        // normal, >1 is faster than normal).
        this.packetRate = this.shortMovingAverage.movingAverage() /
                this.longMovingAverage.movingAverage();
        
        // Play sound.
        //this._playAudio();

        // Hack to avoid setting state during render() invocation (which React
        // doesn't like).
        // TODO: Investigate better solution for this.
        window.setTimeout(() => {
            this.setState({alive: true});
        }, 100);
    }

    _resetParticle(particle, visible=false) {
        /**
         * Resets a single particle.  This returns the particle to its
         * starting location and determines whether or not the particle is
         * currently visible.
         * 
         * @type {number}
         */
        particle.x = 0;
        particle.y = 0;
        particle.z = 0;

        let dX = (Math.random() * 2) - 1;
        let dY = (Math.random() * 20) + 10;
        let dZ = (Math.random() * 2) - 1;
        particle.velocity = new THREE.Vector3(dX, dY, dZ);

        particle.visible = visible;
    }
    
    _generateParticle() {
        /**
         * Generate a single particle.  Particles are three.js Vector3 objects
         * which are suitable for adding to a point mesh.
         * 
         * @type {THREE.Vector3} A particle for adding to a point mesh.
         */
        let particle = new THREE.Vector3(0, 0, 0);
        this._resetParticle(particle);
        
        return particle;
    }

    _prepParticlesForAction() {
        /**
         * Attempt to release as many particles as we want (and can) for this
         * frame.  How many we release will be determined by two things:
         * 
         *   1. How far through the release cycle we are.  Whenever a batch of
         *      new packets come in, we don't release them all at once.  We
         *      instead spread their release over a period of time
         *      (config.releaseDurationMS).  This is done so that the particle
         *      release isn't too bursty and instead results in a more steady
         *      stream.
         * 
         *   2. How many free particles there are.  If there aren't enough
         *      free particles right now then we just don't release as many
         *      as we want to.  Once existing visible particles end their
         *      animation they'll become available again for later use.
         */
        let config = this.particleConfig;
        let particles = this.particles;

        // We don't release all new particles at once.
        config.percentThroughReleaseCycle =
            (Date.now() - config.releaseStart) / config.releaseDurationMS;
        
        let particlesToReleaseNow =
            Math.round(config.particlesToRelease * config.percentThroughReleaseCycle) -
                config.particlesReleased;
        
        let releasedParticles = 0;
        
        for (let i = 0; i < particles.length; i++) {
            // Run through our entire particle array looking for particles which
            // are not currently visible and use them in this release cycle.
            let particle = particles[i];
            if (!particle.visible) {
                this._resetParticle(particle, true);
                releasedParticles++;
                config.particlesReleased++;
            }

            if (releasedParticles >= particlesToReleaseNow) {
                break;
            }
        }

        // Play sound.
        this._playAudio();

        if (config.percentThroughReleaseCycle >= 1) {
            config.releasing = false;
        }
    }
    
    _animateParticles() {
        /**
         * Loop through all our in-flight particles and determine their new
         * positions for this frame.  When a particle drops below the ground
         * plane we reset it for future use.
         */
        for (let i = 0; i < this.particles.length; i++) {
            let particle = this.particles[i];

            if (!particle.visible) {
                continue;
            }

            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            particle.z += particle.velocity.z;

            particle.velocity.y -= 0.2;

            if (particle.y < 0) {
                this._resetParticle(particle);
            }
        }
    }
    
    _renderDeadFountain(basePosition, baseRotation) {
        /**
         * Renders a dead fountain.
         */
        let deadColor = new THREE.Color(.15, .15, .15);

        return (
            <group position={basePosition}>
                <mesh rotation={baseRotation} castShadow={true}>
                    <octahedronGeometry radius={15} detail={0} />
                    <meshPhongMaterial color={deadColor} />
                </mesh>
                <TextLabel
                    key={"label_" + this.layerName}
                    color={deadColor}
                    text={this.layerName}
                    size={15}
                />
            </group>
        );
    }

    _getAudioData() {
        let request = new XMLHttpRequest();

        request.open('GET', './static/test.ogg', true);
        request.responseType = 'arraybuffer';

        request.onload = () => {
            let audioData = request.response;

            this.audioContext.decodeAudioData(audioData, (buffer) => {
                this.audioBuffer = buffer;
            },
            function(e) { "Error decoding audio data: " + e.err });
        };

        request.send();
    }
    
    _playAudio() {
        if (!this.audioBuffer) {
            return false;
        }

        let source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        source.connect(this.audioOutput);
        source.start(0);
    }

    render() {
        /**
         * Render the fountain.
         */
        this._determineCurrentPosition();

        // Determine how many new packets there are (if any) for this frame.
        if (!this.packetCount) {
            // This is the first incoming packet count, so use it to initialize
            // our packet counter and produce a render no-op.
            this.packetCount = this.props.packetCount;
            return false;
        }
        else if (this.props.packetCount > this.packetCount) {
            this._processNewPackets(this.props.packetCount - this.packetCount);
        }

        // Configure fountain base.
        if (this.state.alive) {
            this.y += 0.1 * this.packetRate;
        }
        
        let positionConfig = this.positionConfig;
        let baseRotation = new THREE.Euler(Math.PI, this.y, Math.PI);
        let basePosition = new THREE.Vector3(positionConfig.currentPosition.x,
            positionConfig.currentPosition.y + 5, positionConfig.currentPosition.z);

        if (!this.state.alive) {
            // Fountain is currently dead so we render a dead fountain and
            // skip the particle calculations.
            return this._renderDeadFountain(basePosition, baseRotation);
        }

        if (this.particleConfig.releasing) {
            // We want to release some new particles this frame.
            this._prepParticlesForAction();
        }
        
        // Every in-flight particle needs to have its animation updated.
        this._animateParticles();

        // Return the finished fountain in its current animation state.
        // TODO: The [...this.particles] (to copy the particle array) is done
        //  to force a re-render.  Hopefully there's a better way.
        return (
            <group position={basePosition}>
                <mesh rotation={baseRotation} castShadow={true}>
                    <octahedronGeometry radius={15} detail={0} />
                    <meshPhongMaterial color={this.color} shininess={5} />
                </mesh>
                
                <TextLabel
                    key={"label_" + this.layerName}
                    text={this.layerName}
                    size={15}
                />
                
                <points castShadow={false}>
                    <geometry vertices={[...this.particles]} />
                    <pointsMaterial color={this.color} size={5} />
                </points>
            </group>
        )
    }
}

export default Fountain;