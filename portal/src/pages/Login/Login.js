import React from "react";
import { Redirect } from "react-router-dom";

import { connect } from "react-redux";
import { loginWithCredentials } from "../../actions/authenticate-actions";

import "./Login.css";

const mapStateToProps = state => ({
  attempting_login: state.authenticate.attempting_login,
  auth_token: state.authenticate.local_auth_token
});

// Main app
class Login extends React.Component {
  constructor(props) {
    super(props);
    // Bindings
    this.state = {
      username: "",
      password: ""
    };
  }

  handleUsernameChange(event) {
    this.setState({ username: event.target.value });
  }

  handlePasswordChange(event) {
    this.setState({ password: event.target.value });
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.loginWithCredentials(this.state);
  }

  render() {
    console.log("login render");

    console.log(this.props.auth_token);

    if (this.props.auth_token !== null && this.props.auth_token !== undefined) {
      return (
        <Redirect
          to={{ pathname: "/home", state: { from: this.props.location } }}
        />
      );
    }

    return (
      <div className="login-wrap">
        <div className="login-header">
          <span>Scene Stamp</span>
        </div>
        <div className="Modal">
          <div className="login-title">Sign in</div>
          <div className="login-slogan">Sign in and start stamping scenes!</div>
          <form className="login-form" onSubmit={this.handleSubmit.bind(this)}>
            <div>
              <input
                type="text"
                name="username"
                value={this.state.username}
                onChange={this.handleUsernameChange.bind(this)}
                placeholder="Login"
                required
                autoComplete="false"
              />
            </div>
            <div>
              <input
                type="password"
                name="password"
                value={this.state.password}
                onChange={this.handlePasswordChange.bind(this)}
                placeholder="Password"
                required
                autoComplete="false"
              />
            </div>
            <button className="login-sign">Login</button>
          </form>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  { loginWithCredentials }
)(Login);
