import React from 'react';
import THREE from 'three';


class TextLabel extends React.Component {
    /**
     * Generates a text label.  This is intended specifically for adding a
     * packet layer name next to a fountain base from the Fountain component,
     * so we take some liberties and hardcode position and rotation values.
     */
    constructor(props, context) {
        super(props, context);

        this.state = {};
        
        this.rotation = new THREE.Euler(-Math.PI / 2, 0, 0);
        this.position = new THREE.Vector3(20, 0, 10);
        this.text = props.text;
        this.size = props.size;
        this.font = false;
    }

    componentWillMount() {
        let loader = new THREE.FontLoader();
        loader.load('./static/optimer_regular.typeface.json', (inFont) => {
            this.font = inFont;
        });
    }
    
    render() {
        if (!this.font) {
            // Don't render anything until our font data has arrived.
            return false;
        }
        
        return (
            <mesh position={this.position} rotation={this.rotation}>
                <textGeometry
                    text={this.text}
                    font={this.font}
                    size={this.size}
                    curveSegments={3}
                    height={1}
                />
                <meshPhongMaterial
                    color={this.props.color ? this.props.color :
                        new THREE.Color(1, 1, 1)} />
            </mesh>
        );
    }
}

export default TextLabel;
