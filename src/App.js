import React, { Component } from 'react';
import './App.css';
import YouTube from 'react-youtube';
import getYouTubeID from 'get-youtube-id';
import { Range } from 'rc-slider';
import 'rc-slider/assets/index.css';
import moment from 'moment';
import GitHubButton from 'react-github-button';
import 'react-github-button/assets/style.css';
import ReactGA from 'react-ga';
import { Helmet } from 'react-helmet';

ReactGA.initialize('UA-41378150-8');
ReactGA.pageview('/');

class App extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      videoId: 'Q0W--O7aWBg',
      start: 36,
      end: 58,
      player: null,
      duration: 0
    };
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.start !== this.state.start || nextState.end !== this.state.end) {
      const { start, end } = nextState;
      clearInterval(this.timeoutID);
      this.timeoutID = setInterval(() => {
        if (this.player.getCurrentTime() >= end) {
          this.player.seekTo(start, true);
        }
      }, 1000);
    }
  }

  render() {
    const { videoId, start, end } = this.state;

    const opts = {
      playerVars: {
        autoplay: 1,
        start
      }
    };

    return (
      <div className="youtube-looper">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Youtube Looper - Tool to Loop Slices of Youtube Video</title>
          <link rel="canonical" href="http://mysite.com/example" />
          <meta property="og:title" content="Youtube Looper - Tool to Loop Slices of Youtube Video" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://hiiamyes.github.io/youtube-looper/" />
          <meta property="og:description" content="Tool to Loop Slices of Youtube Video" />
        </Helmet>
        <div className="header">
          <h2 className="title">Youtube Looper</h2>
          <GitHubButton type="stargazers" size="default" namespace="hiiamyes" repo="youtube-looper" />
        </div>
        <YouTube
          className="youtube-player"
          videoId={videoId}
          opts={opts}
          onReady={e => {
            this.setState({
              player: e.target,
              duration: e.target.getDuration()
            });
            this.player = e.target;
            this.timeoutID = setInterval(() => {
              if (e.target.getCurrentTime() >= end) {
                e.target.seekTo(start, true);
              }
            }, 1000);
          }}
        />

        <div className="control">
          <form
            className="url-form"
            onSubmit={e => {
              e.preventDefault();
              this.setState({ videoId: getYouTubeID(this._url.value) });
            }}
          >
            <h3>Youtube Link</h3>
            <input
              className="url-input"
              ref={c => (this._url = c)}
              defaultValue="https://www.youtube.com/watch?v=Q0W--O7aWBg"
            />
          </form>

          <h3>Looper</h3>
          <div className="slider">
            <span>{`${moment.unix(start).format('mm:ss')} - ${moment.unix(end).format('mm:ss')}`}</span>
            <Range
              className="range"
              min={0}
              max={this.state.duration}
              value={[start, end]}
              onChange={([start, end]) => this.setState({ start, end })}
            />
          </div>
        </div>

      </div>
    );
  }
}

export default App;
