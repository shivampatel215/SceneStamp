import React from "react";
import { Player, ControlBar } from "video-react";
import { Dropdown } from "semantic-ui-react";
import "./Home.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { connect } from "react-redux";

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      series: [],
      characters: [],
      categories: [],
      selected: [],
      selectedSeries: [],
      selectedCharacters: [],
      selectedCategories: [],
      scenes: [],
      picked_scenes: [],
      path: "",
      tsMap: {},
      activeClip: -1,
      inputText: "",
      awsUrl: "http://ec2-3-135-195-36.us-east-2.compute.amazonaws.com:8081/",
      showProgress: false,
      percentage: 0,
      exportOrDownload: "EXPORT",
      downloadId: null,
      activeTime: "START",
      logo: "",
      logos: []
    };
    this.handleInputText = this.handleInputText.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleClip = this.handleClip.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.load = this.load.bind(this);
    this.seek = this.seek.bind(this);
  }
  play() {
    this.player.play();
  }

  pause() {
    this.player.pause();
  }

  load(id) {
    this.player.load();
    this.setState({
      currVideo: id,
      path: process.env.PUBLIC_URL + "/episodeVideos/" + id + ".mp4"
    });
  }

  seek(seconds) {
    this.player.seek(seconds);
  }
  handleStateChange(state) {
    let map = this.state.tsMap;
    if (
      state.seeking &&
      this.state.activeClip != -1 &&
      this.state.tsMap[this.state.activeClip].end != state.currentTime
    ) {
      debugger;
      if (this.state.activeTime === "START")
        map[this.state.activeClip].start = Math.round(state.currentTime);
      else map[this.state.activeClip].end = Math.round(state.currentTime);
      map[this.state.activeClip].duration = Math.abs(
        map[this.state.activeClip].end - map[this.state.activeClip].start
      );
      this.setState({ tsMap: map });
    }
  }
  componentDidMount() {
    this.querySeries();
    this.queryCharacters();
    this.queryCategories();
    this.queryLogos();
    this.player.subscribeToStateChange(this.handleStateChange.bind(this));
  }
  secondsToMinutes(time) {
    // Hours, minutes and seconds
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = ~~time % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
      ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
  }
  handleClick(e, id, tId, start) {
    if (this.state.currVideo != id) this.load(id);
    this.seek(start);
    this.setState({ activeClip: tId, activeTime: "START" });
  }
  handleClip(e, element) {
    e.stopPropagation();
    let picked_scene = this.state.tsMap[element.timestamp_id];
    picked_scene["episode_id"] = element["episode_id"];
    picked_scene["timestamp_id"] = element["timestamp_id"];
    let scenes = this.state.picked_scenes;
    scenes.push(picked_scene);
    this.setState({ picked_scenes: scenes });
    let data = this.state.scenes;
    for (var i = 0; i < data.length; i++) {
      if (data[i]["timestamp_id"] == element.timestamp_id) {
        data.splice(i, 1);
      }
    }
    this.setState({ picked_scenes: scenes, scenes: data });
  }
  querySeries() {
    fetch("https://scene-stamp-server.herokuapp.com/getSeriesData")
      .then(response => response.json())
      .then(data => this.setState({ series: this.transform(data, 1) }));
  }
  queryCharacters() {
    fetch("https://scene-stamp-server.herokuapp.com/getCharacterData")
      .then(response => response.json())
      .then(data => this.setState({ characters: this.transform(data, 2) }));
  }
  queryCategories() {
    fetch("https://scene-stamp-server.herokuapp.com/getCategoryData")
      .then(response => response.json())
      .then(data => this.setState({ categories: this.transform(data, 3) }));
  }
  queryLogos() {
    fetch(this.state.awsUrl + "getLogos")
      .then(resp => resp.json())
      .then(data => this.createLogoMap(data.logo_names));
  }
  createLogoMap(logos) {
    let logoMap = [];
    logos.forEach(logo => {
      logoMap.push({ key: logo, value: logo, text: logo });
    });
    this.setState({ logos: logoMap });
  }
  handleSeries = (e, { value }) => {
    return this.setState({ selectedSeries: value });
  };
  handleCharacters = (e, { value }) => {
    return this.setState({ selectedCharacters: value });
  };
  handleCategories = (e, { value }) => {
    return this.setState({ selectedCategories: value });
  };
  handleSubmit(e) {
    e.preventDefault();
    if (this.state.selectedSeries.length > 0) {
      let series_ids = "";
      for (var i = 0; i < this.state.selectedSeries.length; i++) {
        if (i != 0 && i < this.state.selectedSeries.length) {
          series_ids += ",";
        }
        series_ids += this.state.selectedSeries[i];
        fetch(
          "https://scene-stamp-server.herokuapp.com/getEpisodeData?series_ids=" +
            series_ids
        )
          .then(resp => resp.json())
          .then(data => this.getTimestamps(data));
      }
    } else {
      this.getTimestamps([]);
    }
  }
  handleRemove(e, element) {
    let scenes = this.state.scenes;
    let entry = {};
    let data = this.state.picked_scenes;
    entry["start_time"] = element.end;
    entry["episode_id"] = element.episode_id;
    entry["timestamp_id"] = element.timestamp_id;
    scenes.push(entry);
    for (let i = 0; i < data.length; i++) {
      if (data[i]["timestamp_id"] == element.timestamp_id) {
        data.splice(i, 1);
      }
    }
    this.setState({ scenes: scenes, picked_scenes: data });
  }
  handleInputText(e) {
    this.setState({ inputText: e.target.value });
  }
  handleDownload(e) {
    this.setState({ showProgress: false, percentage: 0 });
    window.open(
      this.state.awsUrl +
        "downloadCompilation?compilation_id=" +
        this.state.downloadId
    );
    this.setState({ downloadId: null, exportOrDownload: "EXPORT" });
  }
  handleCreateVideo(e) {
    let file_name = this.state.inputText;
    if (file_name == "") {
      alert("Please enter in a file name for this compilation!");
    } else if (this.state.picked_scenes.length == 0) {
      alert("Please add more scenes!");
    } else {
      let comp_data = this.createCompilationData();
      fetch(this.state.awsUrl + "createCompilation", {
        method: "post",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(comp_data)
      })
        .then(res => res.json())
        .then(data => this.pollStatus(data));
    }
  }
  pollStatus(data) {
    this.setState({ showProgress: true });
    this.setState({ downloadId: data.compilation_id });
    this.interval = setInterval(() => {
      fetch(
        this.state.awsUrl +
          "getCompilationStatus?compilation_id=" +
          data.compilation_id
      )
        .then(res => res.json())
        .then(res => {
          if (res.completed) {
            this.setState({ percentage: 100, exportOrDownload: "DL" });
            clearInterval(this.interval);
          } else {
            this.setState({ percentage: res.percentage * 100 });
          }
        });
    }, 15000);
  }
  createCompilationData() {
    let data = this.state.picked_scenes;
    let ret = {};
    let timestamps = [];
    debugger;
    for (let i = 0; i < data.length; i++) {
      timestamps.push({
        episode_id: data[i].episode_id,
        start_time: data[i].start,
        duration: data[i].duration,
        timestamp_id: data[i].timestamp_id
      });
    }
    ret["compilation_name"] = this.state.inputText;
    ret["timestamps"] = timestamps;
    ret["logo"] = this.state.logo;
    return ret;
  }
  getTimestamps(data) {
    let query_str = "";
    if (data.length > 0) {
      query_str += "episode_ids=";
      for (let i = 0; i < data.length; i++) {
        if (i != 0 && i < data.length) query_str += ",";
        query_str += data[i].episode_id;
      }
    }
    if (this.state.selectedCharacters.length > 0) {
      if (data.length > 0) query_str += "&";
      query_str += "character_ids=";
      for (let i = 0; i < this.state.selectedCharacters.length; i++) {
        if (i != 0 && i < this.state.selectedCharacters.length)
          query_str += ",";
        query_str += this.state.selectedCharacters[i];
      }
    }
    if (this.state.selectedCategories.length > 0) {
      if (data.length > 0 || this.state.selectedCharacters.length > 0)
        query_str += "&";
      query_str += "category_ids=";
      for (let i = 0; i < this.state.selectedCategories.length; i++) {
        if (i != 0 && i < this.state.selectedCategories.length)
          query_str += ",";
        query_str += this.state.selectedCategories[i];
      }
    }
    fetch(
      "https://scene-stamp-server.herokuapp.com/getTimestampData?" + query_str
    )
      .then(resp => resp.json())
      .then(data => this.createMap(data));
  }
  createMap(data) {
    let map = {};
    for (let i = 0; i < data.length; i++) {
      map[data[i].timestamp_id] = {
        start: 0,
        duration: 0,
        end: data[i].start_time
      };
    }
    this.setState({ scenes: data, tsMap: map });
  }
  transform(data, num) {
    let id = "";
    let text = "";
    let ret_data = [];
    if (num == 1) {
      id = "series_id";
      text = "series_name";
    } else if (num == 2) {
      id = "character_id";
      text = "character_name";
    } else {
      id = "category_id";
      text = "category_name";
    }
    for (var i = 0; i < data.length; i++) {
      ret_data.push({
        key: data[i][id],
        value: data[i][id],
        text: data[i][text]
      });
    }
    return ret_data;
  }
  render() {
    return (
      <div className="content-container">
        <h2>Select Scenes</h2>
        <div>
          <div className="scenes-dropdown">
            <Dropdown
              clearable
              fluid
              multiple
              search
              selection
              options={this.state.series}
              onChange={this.handleSeries}
              placeholder="Select Series"
            />
          </div>
          <div className="scenes-dropdown">
            <Dropdown
              clearable
              fluid
              multiple
              search
              selection
              options={this.state.characters}
              onChange={this.handleCharacters}
              placeholder="Select Characters"
            />
          </div>
          <div className="scenes-dropdown">
            <Dropdown
              clearable
              fluid
              multiple
              search
              selection
              options={this.state.categories}
              onChange={this.handleCategories}
              placeholder="Select Categories"
            />
          </div>
          <button className="scenes-btn" onClick={this.handleSubmit}>
            Get Scenes
          </button>
        </div>
        <div className="scenes-container">
          <h3>Pick Scenes</h3>
          <div className="scenes-potential">
            {this.state.scenes.map(element => (
              <div
                onClick={e =>
                  this.handleClick(
                    e,
                    element.episode_id,
                    element.timestamp_id,
                    element.start_time
                  )
                }
                className={
                  element.timestamp_id == this.state.activeClip
                    ? "active-clip scene-container"
                    : "scene-container"
                }
              >
                <div>{element.episode_id}</div>
                <div>
                  <div className="scene-start-time">
                    <span
                      className={
                        this.state.activeTime === "START" &&
                        element.timestamp_id == this.state.activeClip
                          ? "scene-time-active"
                          : ""
                      }
                      onClick={e => {
                        if (element.timestamp_id == this.state.activeClip) {
                          e.stopPropagation();
                          this.setState({ activeTime: "START" });
                        }
                      }}
                    >
                      Start:{" "}
                      {this.secondsToMinutes(
                        this.state.tsMap[element.timestamp_id].start
                      )}
                    </span>
                    <span
                      className={
                        this.state.activeTime === "END" &&
                        element.timestamp_id == this.state.activeClip
                          ? "scene-time-active"
                          : ""
                      }
                      onClick={e => {
                        if (element.timestamp_id == this.state.activeClip) {
                          e.stopPropagation();
                          this.setState({ activeTime: "END" });
                        }
                      }}
                    >
                      End:{" "}
                      {this.secondsToMinutes(
                        this.state.tsMap[element.timestamp_id].end
                      )}
                    </span>
                    <span>
                      Duration:{" "}
                      {this.secondsToMinutes(
                        this.state.tsMap[element.timestamp_id].duration
                      )}
                    </span>
                  </div>
                  <div>
                    <FontAwesomeIcon
                      onClick={e => this.handleClip(e, element)}
                      icon={faCheck}
                      className="icon-check icons"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="picked-header">
            <div>
              <Dropdown
                placeholder="Logo"
                search
                selection
                options={this.state.logos}
                onChange={(e, value) => this.setState({ logo: value.value })}
              />
            </div>
            <input
              placeholder="Video Name..."
              value={this.state.inputText}
              onChange={this.handleInputText}
            />
            <button
              onClick={e =>
                this.state.exportOrDownload == "EXPORT"
                  ? this.handleCreateVideo(e)
                  : this.handleDownload(e)
              }
            >
              {this.state.exportOrDownload}
            </button>
            {this.state.showProgress ? (
              <div className="w3-light-grey">
                <div
                  className="w3-green"
                  style={{ width: this.state.percentage + "%" }}
                />
              </div>
            ) : null}
          </div>
          <div className="scenes-picked">
            {this.state.picked_scenes.map(element => (
              <div
                onClick={e =>
                  this.handleClick(
                    e,
                    element.episode_id,
                    element.timestamp_id,
                    element.start
                  )
                }
                className={
                  element.timestamp_id == this.state.activeClip
                    ? "active-clip scene-container"
                    : "scene-container"
                }
              >
                <div>{element.episode_id}</div>
                <div>
                  <div className="scene-start-time">
                    <span>Start: {this.secondsToMinutes(element.start)}</span>
                    <span>End: {this.secondsToMinutes(element.end)}</span>
                    <span>
                      Duration: {this.secondsToMinutes(element.duration)}
                    </span>
                  </div>
                  <div>
                    <FontAwesomeIcon
                      onClick={e => this.handleRemove(e, element)}
                      icon={faTimes}
                      className="icon-close icons"
                    />
                  </div>
                </div>
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
)(Home);
