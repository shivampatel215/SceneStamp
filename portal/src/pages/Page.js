import React from "react";
import { Route, Redirect, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { PRIMARY } from "../color-scheme";
import "./Page.css";

//Components
import Header from "../components/Header/Header";

//inner pages
import Home from "./Home/Home";
import LinkToEpisode from "./LinkToEpisode/LinkToEpisode";
import Login from "./Login/Login";
import Live from "./Live/Live";
import Compilations from "./Compilations/Compilations";

//redux
import { connect } from "react-redux";
import { getLocalAuthToken, logout } from "../actions/authenticate-actions";
import { resetSucsessInfo } from "../actions/notification-actions";

const mapStateToProps = state => ({
  auth_token: state.authenticate.local_auth_token,
  error: state.notification.error,
  sucsess_info: state.notification.sucsess_info
});

class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      innerPages: [
        { path: "/home", component: <Home /> },
        { path: "/linkToEpisode", component: <LinkToEpisode /> },
        { path: "/live", component: <Live /> },
        { path: "/Compilations", component: <Compilations /> }
      ],
      outerPages: [{ path: "/login", component: <Login /> }]
    };
  }

  render() {
    if (this.props.sucsess_info !== null) {
      toast.info(this.props.sucsess_info);
      this.props.resetSucsessInfo();
    }

    if (this.props.error) {
      if (this.props.error.status === 401) this.props.logout();
      toast.error(
        this.props.error.error_message + "\nid:" + this.props.error.id
      );
    }

    //null check; initial value is undefined and will remain so till the auth token is retreived
    if (this.props.auth_token === undefined) {
      this.props.getLocalAuthToken();
      return null;
    }

    var correspondingOuterPage = this.state.outerPages.find(
      op => op.path === this.props.path
    );
    var correspondingInnerPage = this.state.innerPages.find(
      ip => ip.path === this.props.path
    );
    var innerPageNotFound = () => {
      return (
        <Redirect
          to={{ pathname: "/home", state: { from: this.props.location } }}
        />
      );
    };

    return (
      <div className="Page">
        <div className="content">
          <Header />
          <ToastContainer autoClose={3000} />
          {this.props.auth_token !== null ? ( //null means no auth token found
            correspondingInnerPage !== undefined ? (
              correspondingInnerPage.component
            ) : (
              innerPageNotFound()
            )
          ) : correspondingOuterPage !== undefined ? (
            correspondingOuterPage.component
          ) : (
            <Redirect
              to={{ pathname: "/login", state: { from: this.props.location } }}
            />
          )}
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  { getLocalAuthToken, logout, resetSucsessInfo }
)(Page);
