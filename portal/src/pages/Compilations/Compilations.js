import React from "react";
import { Player, ControlBar } from "video-react";
import "./Compilations.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { connect } from "react-redux";

class Compilations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      videos: [],
      path: "",
      url: "http://ec2-3-135-195-36.us-east-2.compute.amazonaws.com:8081/"
    };
  }

  load(id) {
    this.player.load();
    this.setState({
      selectedCompilation: id,
      path: process.env.PUBLIC_URL + "/compilationVideos/" + id + ".mp4"
    });
  }

  seek(seconds) {
    this.player.seek(seconds);
  }

  componentDidMount() {
    this.getCompilationVideos();
  }

  getCompilationVideos() {
    fetch(this.state.url + "getCompilationVideos")
      .then(response => response.json())
      .then(data => this.populateVideos(data.videos));
  }

  populateVideos(data) {
    this.setState({ videos: data });
  }

  render() {
    return (
      <div className="compilations-container">
        <div>
          <h3>Select Video</h3>
          <div className="compilations-list">
            {this.state.videos.map(element => (
              <div
                onClick={e => this.load(element)}
                className={
                  this.state.selectedCompilation == element
                    ? "selected-compilation"
                    : ""
                }
              >
                {element}
              </div>
            ))}
          </div>
        </div>
        <div className="video-styles">
          <Player
            ref={player => {
              this.player = player;
            }}
            autoPlay
          >
            <source src={this.state.path} />
            <ControlBar autoHide={false} />
          </Player>
        </div>
      </div>
    );
  }
}

export default connect(
  null,
  {}
)(Compilations);
