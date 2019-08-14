import React from "react";
import ReactDOM from "react-dom";

// import { App } from "./current";
import { App } from "./new";

const rootElement = document.getElementById("root");
ReactDOM.render(<App hello="world" />, rootElement);
