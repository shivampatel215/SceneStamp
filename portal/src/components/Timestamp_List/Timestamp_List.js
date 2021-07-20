import React from "react";

import { connect } from "react-redux";
import {
  getTimestampData,
  getEpisodeData,
  getCharacterData,
  getCategoryData
} from "../../actions/timestamp-actions";
import { getLinkedVideos } from "../../actions/video-actions";

import "./Timestamp_List.css";

import Timestamp from "../Timestamp/Timestamp";

const mapStateToProps = state => ({
  timestamp_data: state.timestamp.timestamp_data
});

class Timestamp_List extends React.Component {
  componentWillMount() {
    if (this.props.timestamp_data.length === 0) {
      this.props.getTimestampData();
      this.props.getEpisodeData();
      this.props.getCharacterData();
      this.props.getCategoryData();
      this.props.getLinkedVideos();
    }
  }

  render() {
    var timestamps = [];
    this.props.timestamp_data.forEach((timestamp, index) => {
      timestamps.push(<Timestamp key={index} timestamp={timestamp} />);
    });

    return (
      <div>
        <ul className="live-timeline">{timestamps}</ul>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  {
    getTimestampData,
    getEpisodeData,
    getCharacterData,
    getCategoryData,
    getLinkedVideos
  }
)(Timestamp_List);
