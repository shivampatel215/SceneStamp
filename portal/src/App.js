import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect
} from "react-router-dom";
import "../node_modules/video-react/dist/video-react.css"; // import css
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file

import { Provider } from "react-redux";
import store from "./store";

import { PRIMARY } from "./color-scheme";

//Pages
import Page from "./pages/Page";

import "./App.css";

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <div className="App">
          <Router>
            <Switch>
              <Page path="/linkToEpisode" />
              <Page path="/home" />
              <Page path="/login" />
              <Page path="/live" />
              <Page path="/Compilations" />
              <Redirect
                to={{ pathname: "/home", state: { from: this.props.location } }}
              />
            </Switch>
          </Router>
        </div>
      </Provider>
    );
  }
}

export default App;
