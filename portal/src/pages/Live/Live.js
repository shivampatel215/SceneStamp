import React from "react";
import "./Live.css";
import { Calendar } from "react-date-range";
import { DateRange } from "react-date-range";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Player, ControlBar } from "video-react";
import {
  faCalendarAlt,
  faCheck,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { connect } from "react-redux";

class Live extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dateRange: {
        selection: {
          startDate: new Date(),
          endDate: new Date(),
          key: "selection"
        }
      },
      prevStart: new Date(),
      prevEnd: new Date(),
      hideCalendar: true,
      url: "https://scene-stamp-server.herokuapp.com/",
      games: [],
      selectedGame: null,
      currTimestamps: [],
      multiplier: 0,
      awsUrl: "http://ec2-3-135-195-36.us-east-2.compute.amazonaws.com:8081/",
      path: "",
      loaded: false,
      bigMoments: [],
      selectedScene: "",
      currentTime: -1,
      hideOffset: false
    };
  }

  componentDidMount() {
    this.fetchGames();
  }

  handleRangeChange(which, payload) {
    this.setState({
      [which]: {
        ...this.state[which],
        ...payload
      }
    });
  }

  handleStateChange(state, prevState) {
    this.setState({
      currentTime: state.currentTime
    });
  }

  handleCalendar(element) {
    if (this.state.hideCalendar) {
      this.setState({ hideCalendar: false });
    } else {
      this.setState({ hideCalendar: true });
      if (
        this.state.prevStart != this.state.dateRange.selection.startDate ||
        this.state.prevEnd != this.state.dateRange.selection.endDate
      ) {
        this.setState({
          hideCalendar: true,
          prevStart: this.state.dateRange.selection.startDate,
          prevEnd: this.state.dateRange.selection.endDate
        });
        this.fetchGames();
      } else {
        this.setState({ hideCalendar: true });
      }
    }
  }

  addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  fetchGames() {
    fetch(
      this.state.url +
        "getEpisodeData?nbaAfterEpochTime=" +
        this.state.dateRange.selection.startDate.getTime() +
        "&nbaBeforeEpochTime=" +
        this.addDays(this.state.dateRange.selection.endDate, 1).getTime()
    )
      .then(resp => resp.json())
      .then(data => this.setState({ games: data }));
  }

  fetchTimestamps(id) {
    fetch(
      "https://scene-stamp-server.herokuapp.com/getTimestampData?episode_ids=" +
        id
    )
      .then(resp => resp.json())
      .then(data => this.sortByKey(data, "nba_timestamp_id"));
  }

  selectGame(e, element) {
    if (element.episode_id != this.state.selectedGame) {
      this.fetchTimestamps(element.episode_id);
      this.videoLink(element.episode_id);
      if (element.video_offset !== null) {
        this.setState({ hideOffset: true, selectedGame: element.episode_id });
      } else {
        this.setState({ selectedGame: element.episode_id, hideOffset: false });
      }
    }
  }

  videoLink(id) {
    fetch(this.state.awsUrl + "getLinkedVideos")
      .then(res => res.json())
      .then(data => {
        if ("videos" in data && data.videos.indexOf(id.toString()) != -1) {
          this.setState({
            path: "/static/media/episodeVideos/" + id + ".mp4",
            loaded: true
          });
          this.player.subscribeToStateChange(this.handleStateChange.bind(this));
        } else {
          this.setState({ loaded: false });
        }
      });
  }

  sortByKey(array, key) {
    array.sort(function(a, b) {
      var x = a[key].substring(a[key].length - 3);
      var y = b[key].substring(b[key].length - 3);
      return x < y ? -1 : x > y ? 1 : 0;
    });
    this.setState({
      currTimestamps: array
    });
  }

  updateTimestamp(id, categories) {
    let categoriesString = "";
    let hasCat = false;
    for (var i = 0; i < categories.length; i++) {
      if (categories[i] == 98206) {
        hasCat = true;
      }
      categoriesString += categories[i] + ",";
    }
    if (!hasCat) {
      categoriesString += "98206";
    } else {
      categoriesString = categoriesString.substring(
        0,
        categoriesString.length - 1
      );
    }
    fetch(
      this.state.url +
        "updateTimestamp?timestamp_id=" +
        id +
        "&category_ids=" +
        categoriesString
    );
  }

  handleRemove(e, id) {
    this.setState({ bigMoments: this.arrayRemove(this.state.bigMoments, id) });
  }

  handleAdd(e, id, categories) {
    const moments = this.state.bigMoments;
    moments.push(id);
    this.setState({ bigMoments: moments });
    this.updateTimestamp(id, categories);
  }

  handleOffset(e) {
    if (this.state.currentTime > -1) {
      this.setOffset(this.state.currentTime);
      this.setState({ hideOffset: true });
    }
  }

  setOffset(offset) {
    const postData = {
      episode_id: this.state.selectedGame,
      video_offset: Math.round(offset)
    };
    fetch(this.state.url + "updateEpisode", {
      method: "post",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(postData)
    });
  }

  selectScene(e, timestamp) {
    if (timestamp.start_time > -1 && this.state.loaded) {
      this.player.seek(timestamp.start_time);
    }
  }

  arrayRemove(arr, value) {
    return arr.filter(function(ele) {
      return ele != value;
    });
  }

  render() {
    return (
      <div className="live-container">
        <div className="live-content">
          <div className="live-games-title">
            <FontAwesomeIcon
              onClick={e => this.handleCalendar(e)}
              icon={faCalendarAlt}
              className="calendar-icon"
            />
            <span>
              {this.state.dateRange.selection.startDate.toLocaleDateString(
                "en-US",
                { year: "2-digit", month: "2-digit", day: "2-digit" }
              )}{" "}
              -{" "}
              {this.state.dateRange.selection.endDate.toLocaleDateString(
                "en-US",
                {
                  year: "2-digit",
                  month: "2-digit",
                  day: "2-digit"
                }
              )}
            </span>
          </div>
          <div>
            <DateRange
              onChange={this.handleRangeChange.bind(this, "dateRange")}
              moveRangeOnFirstSelection={false}
              ranges={[this.state.dateRange.selection]}
              className={
                this.state.hideCalendar ? "hide-calendar" : "show-calendar"
              }
            />
          </div>
          <div className="live-data">
            <div className="live-list">
              {this.state.games.map(element => (
                <div
                  className={
                    this.state.selectedGame == element.episode_id
                      ? "live-game selected-game"
                      : "live-game"
                  }
                  onClick={e => this.selectGame(e, element)}
                >
                  <div>
                    {element.episode_name.substring(0, 3)}
                    {" vs "}
                    {element.episode_name.substring(3, 6)}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="live-scenes">
                <div>
                  <ul className="live-timeline">
                    {this.state.currTimestamps.map((timestamp, index) => (
                      <li onClick={e => this.selectScene(e, timestamp)}>
                        <div>{timestamp.nba_play_description}</div>
                        {this.state.bigMoments.indexOf(
                          timestamp.timestamp_id
                        ) != -1 || timestamp.categories.indexOf(98206) != -1 ? (
                          <FontAwesomeIcon
                            onClick={e =>
                              this.handleRemove(e, timestamp.timestamp_id)
                            }
                            icon={faTimes}
                            className="icon-close icons"
                          />
                        ) : (
                          <FontAwesomeIcon
                            onClick={e =>
                              this.handleAdd(
                                e,
                                timestamp.timestamp_id,
                                timestamp.categories
                              )
                            }
                            icon={faCheck}
                            className="icon-check icons"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                  {!this.state.hideOffset && this.state.loaded ? (
                    <div className="live-offset">
                      <span>Offset</span>
                      <input readOnly value={this.state.currentTime} />
                      <button onClick={e => this.handleOffset(e)}>
                        Set Offset
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="live-video-container">
                  {this.state.loaded ? (
                    <Player
                      ref={player => {
                        this.player = player;
                      }}
                      autoPlay
                    >
                      <source src={this.state.path} />
                      <ControlBar autoHide={false} />
                    </Player>
                  ) : (
                    <div className="live-video-unavailable">
                      Video Unavailable
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  null,
  {}
)(Live);
