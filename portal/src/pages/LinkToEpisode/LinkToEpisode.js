import React from "react";
import { Redirect } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import { Dropdown } from "semantic-ui-react";
import { getEpisodeData } from "../../actions/timestamp-actions";
import { Player, ControlBar } from "video-react";
import {
  getLinkedVideos,
  getUnlinkedVideos,
  resetLinkToEpisode,
  getLinkToEpisode
} from "../../actions/video-actions";

import { connect } from "react-redux";

import { PRIMARY, RED, GREEN } from "../../color-scheme";
import "./LinkToEpisode.css";

const mapStateToProps = state => ({
  unlinked_videos: state.video.unlinked_videos,
  linked_videos: state.video.linked_videos,
  episode_data: state.timestamp.episode_data,
  link_to_episode: state.video.link_to_episode
});

// Main app
class LinkToEpisode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedUnlinkedName: null,
      selectedEpisodeId: null,
      linked: [],
      videos: [],
      selectedVideo: null,
      selectedLinked: null,
      path: ""
    };
  }

  updateUnlinkedVid(name) {
    this.setState({
      selectedUnlinkedName:
        this.state.selectedUnlinkedName === name ? null : name
    });
  }

  updateSelectEpisodeId(id) {
    this.setState({
      selectedEpisodeId: this.state.selectedEpisodeId === id ? null : id
    });
  }

  makeNeededServerCalls() {
    this.props.getUnlinkedVideos();
    this.props.getLinkedVideos();
    this.props.getEpisodeData();
  }

  componentWillMount() {
    this.makeNeededServerCalls();
  }

  submit() {
    this.props.getLinkToEpisode({
      unlinked_video: this.state.selectedUnlinkedName,
      episode_id: this.state.selectedEpisodeId
    });
  }

  reset() {
    this.props.resetLinkToEpisode().then(() => {
      this.makeNeededServerCalls();
    });
  }

  unlinkedVideos() {
    const unlinkedVideos = [];
    this.props.unlinked_videos.forEach(vid =>
      unlinkedVideos.push({ value: vid, key: vid, text: vid })
    );
    return unlinkedVideos;
  }

  linkedVideos() {
    const x = this.props.episode_data
      .filter(ep => this.props.linked_videos.includes(ep.episode_id) === false)
      .map(ep => this.createEpisodeObject(ep));
    return x;
  }

  createEpisodeObject(ep) {
    return {
      value: ep.episode_name,
      text: ep.episode_name,
      key: ep.episode_id,
      youtube_id: ep.youtube_id
    };
  }

  handleUnlinked(value, data) {
    debugger;
    this.setState({
      selectedVideo: value,
      path: require("../../../../../../unlinkedVideos/" + data.value + ".mov")
    });
    this.player.load();
  }

  handleLinked(value, data) {
    const currentOption = data.options.find(o => o.value === data.value);
    this.setState({ selectedLinked: currentOption });
  }

  render() {
    if (this.props.link_to_episode) {
      this.reset();
    }

    var createInfoMsg = info => {
      return (
        <div className="infoSection">
          <span>{info}</span>
        </div>
      );
    };

    var createButton = () => {
      return this.state.selectedEpisodeId !== null &&
        this.state.selectedUnlinkedName !== null ? (
        <button className="submitButton enabled" onClick={() => this.submit()}>
          {" "}
          Link Episode{" "}
        </button>
      ) : (
        <button className="submitButton option disabled"> Link Episode </button>
      );
    };

    if (this.props.episode_data.length > 0 && this.state.linked.length == 0) {
      this.setState({ linked: this.linkedVideos() });
    }

    if (
      this.props.unlinked_videos.length > 0 &&
      this.state.videos.length == 0
    ) {
      this.setState({ videos: this.unlinkedVideos() });
    }

    return (
      <div className="linkToEpisode">
        <div className="main-container">
          <div className="section">
            <div className="innerSection">
              <Dropdown
                fluid
                search
                selection
                options={this.state.videos}
                onChange={this.handleUnlinked.bind(this)}
                placeholder="Select Video"
              />
            </div>
          </div>
          <div className="section">
            <div className="innerSection">
              <Dropdown
                fluid
                search
                selection
                options={this.state.linked}
                onChange={this.handleLinked.bind(this)}
                placeholder="Select Video"
              />
            </div>{" "}
          </div>
        </div>
        <div className="link-submit-div">
          <Player
            ref={player => {
              this.player = player;
            }}
            autoPlay
          >
            <source src={this.state.path} />
            <ControlBar autoHide={false} />
          </Player>
          <div>
            {this.state.selectedVideo !== null &&
            this.state.selectedLinked !== null ? (
              <div>
                <button
                  className="submitButton enabled"
                  onClick={() => this.submit()}
                >
                  {" "}
                  Link Episode{" "}
                </button>
              </div>
            ) : (
              <button className="submitButton option disabled">
                {" "}
                Link Episode{" "}
              </button>
            )}
            {this.state.selectedLinked &&
            this.state.selectedLinked.youtube_id !== null ? (
              <a
                href={
                  "https://www.youtube.com/watch?v=" +
                  this.state.selectedLinked.youtube_id
                }
                target="_blank"
                className="scene-yt-link"
              >
                <FontAwesomeIcon icon={faYoutube} className="icon-youtube" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  {
    getLinkedVideos,
    getUnlinkedVideos,
    getEpisodeData,
    resetLinkToEpisode,
    getLinkToEpisode
  }
)(LinkToEpisode);
