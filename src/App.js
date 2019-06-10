import React from 'react';
import ReactDOM from 'react-dom';
import Packscape from './components/Packscape/Packscape';
import EventEmitter from 'events';

import styles from './app.css';


// ---------------------------------------------------------------------------
// Event emitter
//
// This event emitter is used to emit all incoming dumplings to any interested
// React components in the application.

class DumplingEmitter extends EventEmitter {}

const dumplingEmitter = new DumplingEmitter();
dumplingEmitter.setMaxListeners(100);


// ---------------------------------------------------------------------------
// Websocket
//
// Connect to shifty and emit every incoming dumpling on a channel named
// after each dumpling chef.  This will normally be "PacketCountChef" (that's
// the only chef we care about for this).

let ws = new WebSocket("ws://localhost:11348/");

ws.onopen = () => {
    // Send shifty our name.  This prompts shifty to start sending us all
    // its subsequent dumplings.
    ws.send(JSON.stringify({eater_name: "packscape"}));
};

ws.onmessage = (event) => {
    // Emit every incoming dumpling on a channel with the same name as the
    // dumpling's chef.
    let dumpling = JSON.parse(event.data);
    dumplingEmitter.emit(dumpling.metadata.chef, dumpling.payload);
};


// ---------------------------------------------------------------------------
// Render the application.

let App = ReactDOM.render(
    <Packscape dumplingEmitter={dumplingEmitter} />,
    document.getElementById("app")
);

export default App;
