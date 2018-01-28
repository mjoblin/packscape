import React from 'react';
import THREE from 'three';


class Ground extends React.Component {
    /**
     * Render a simple ground geometry for our fountains to sit on.
     */
    constructor(props, context) {
        super(props, context);
        this.state = {};
    };

    componentDidMount() {
        this.refs.shaderMaterial.extensions.derivatives = true;
        this.refs.shaderMaterial.uniforms = [];
    }

    getShaderMaterial() {
        let vertexShader = `
            attribute vec3 center;
            varying vec3 vCenter;
            
            void main() {
                vCenter = center;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
         `;

        let fragmentShader = `
            void main() {
                gl_FragColor.r = 0.3;
                gl_FragColor.g = 1.0;
                gl_FragColor.b = 0.5;
            }
        `;

        return(
            <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} ref="shaderMaterial" />
        );
    }

    render() {
        return (
            <mesh position={new THREE.Vector3(0, -25, 0)} receiveShadow={true}>
                <cylinderGeometry
                    radiusTop={1500}
                    radiusBottom={1500}
                    height={30}
                    radialSegments={36}
                />
                {this.getShaderMaterial()}
            </mesh>
        );
    }
}
//{this.getShaderMaterial()}
//<meshPhongMaterial color={0x157715} />

export default Ground;
