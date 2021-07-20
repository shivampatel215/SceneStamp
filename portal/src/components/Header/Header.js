import React from "react";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";

import "./Header.css";
import { ACCENT_1 } from "../../color-scheme";

import { connect } from "react-redux";
import { logout } from "../../actions/authenticate-actions";

const mapStateToProps = state => ({});

export class Header extends React.Component {
  constructor() {
    super();
    this.state = {
      noHeader: ["/login"],
      tabs: [],
      actions: [
        {
          text: "Logout",
          action: this.logout
        }
      ]
    };
  }

  logout() {
    this.props.logout();
  }

  render() {
    if (this.state.noHeader.includes(this.props.location.pathname)) {
      return null;
    }

    var tabs = [];
    this.state.tabs.forEach((tab, index) => {
      tabs.push(
        <div
          className="header link"
          key={index}
          style={{ backgroundColor: ACCENT_1 }}
        >
          <Link to={tab.path}>{tab.text}</Link>
        </div>
      );
    });

    this.state.actions.forEach((action, index) => {
      tabs.push(
        <div
          key={this.state.tabs.length + index}
          onClick={action.action.bind(this)}
        >
          {action.text}
        </div>
      );
    });

    return (
      <nav className="main-nav">
        <div>
          <a href="/home">SCENE STAMP</a>
        </div>
        <div>
          <div>
            <a href="/home">Home</a>
          </div>
          <div>
            <a href="/linkToEpisode">Link</a>
          </div>
          <div>
            <a href="/live">Live</a>
          </div>
          <div>
            <a href="/compilations">Compilations</a>
          </div>
          {tabs}
        </div>
      </nav>
      // <nav id="mainNavBar" className="nav-container">
      //   <div className="title">SCENE STAMP</div>
      //   <div className="navBarHeaders" >
      //     {tabs}
      //   </div>
      // </nav>
    );
  }
}

export default connect(
  mapStateToProps,
  { logout }
)(withRouter(Header));
