import React from 'react';
import THREE from 'three';


class Ground extends React.Component {
    /**
     * Render a simple ground geometry for our fountains to sit on.
     */
    constructor(props, context) {
        super(props, context);
        this.state = {};
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
                <meshPhongMaterial color={0x157715} />
            </mesh>
        );
    }
}

export default Ground;
