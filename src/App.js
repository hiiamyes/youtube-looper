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
import './bootstrap/css/bootstrap.min.css';
import Immutable from 'immutable';
import classNames from 'classnames';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import axios from 'axios';
import { googleAPIKey } from './keys';

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('UA-41378150-8');
  ReactGA.pageview('/');
}

class App extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      youTubes: Immutable.fromJS(
        JSON.parse(localStorage.getItem('youTubes')) || [
          {
            id: 'riyjAo3szbQ',
            start: 69,
            end: 91,
            duration: 255,
            title: 'MONOEYES - Get Up（Music Video）'
          }
        ]
      ),
      isValidYouTubeLink: true,
      iYouTube: JSON.parse(localStorage.getItem('iYouTube')) || 0,
      player: null
    };
  }

  componentWillUpdate(nextProps, nextState) {
    if (
      JSON.stringify(this.state.youTubes.get(this.state.iYouTube).toJS()) !==
      JSON.stringify(nextState.youTubes.get(nextState.iYouTube).toJS())
    ) {
      const { youTubes, iYouTube } = nextState;
      const start = youTubes.getIn([iYouTube, 'start']);
      const end = youTubes.getIn([iYouTube, 'end']);
      clearInterval(this.timeoutID);
      this.timeoutID = setInterval(() => {
        if (this.player.getCurrentTime() >= end) {
          this.player.seekTo(start, true);
        }
      }, 1000);
    }
  }

  render() {
    const { youTubes, iYouTube, isValidYouTubeLink } = this.state;
    const id = youTubes.getIn([iYouTube, 'id']);
    const start = youTubes.getIn([iYouTube, 'start']);
    const end = youTubes.getIn([iYouTube, 'end']);
    const duration = youTubes.getIn([iYouTube, 'duration']);
    const opts = {
      playerVars: {
        autoplay: 1,
        start,
        end: end + 1
      }
    };
    const options = youTubes.map((y, i) => ({ label: y.get('title'), value: i })).toJS();
    return (
      <div className="youtube-looper">
        <Helmet>
          <meta charSet="utf-8" />
          <title>YouTube Looper - Tool to Loop Slices of Youtube Video</title>
          <meta property="og:title" content="Youtube Looper - Tool to Loop Slices of Youtube Video" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://hiiamyes.github.io/youtube-looper/" />
          <meta property="og:description" content="Tool to Loop Slices of Youtube Video" />
        </Helmet>

        <div className="header">
          <h2 className="title">YouTube Looper</h2>
          <GitHubButton type="stargazers" namespace="hiiamyes" repo="youtube-looper" />
        </div>

        <div className="control">
          <form
            className={classNames('url-form', 'form-inline')}
            onSubmit={e => {
              e.preventDefault();
            }}
          >
            <input
              className={classNames('url-input', 'form-control')}
              ref={c => (this._url = c)}
              onChange={e => {
                const youTubeID = getYouTubeID(e.target.value);
                if (youTubeID) {
                  this.setState({ isValidYouTubeLink: true, youTubeID });
                  if (youTubes.filter(y => y.get('id') === youTubeID).size === 0) {
                    axios
                      .get(
                        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${youTubeID}&key=${googleAPIKey}`
                      )
                      .then(({ data }) => {
                        console.log(moment.duration(data.items[0].contentDetails.duration).asSeconds());
                        const duration = moment.duration(data.items[0].contentDetails.duration).asSeconds();
                        let newYouTubes = Immutable.fromJS([
                          {
                            id: youTubeID,
                            start: 0,
                            end: duration,
                            duration,
                            title: data.items[0].snippet.title
                          }
                        ])
                          .concat(youTubes)
                          .take(10);
                        localStorage.setItem('youTubes', JSON.stringify(newYouTubes.toJS()));
                        this.setState({ youTubes: newYouTubes, iYouTube: 0 });
                      });
                  } else {
                    this.setState({ iYouTube: youTubes.findIndex(y => y.id === youTubeID) });
                  }
                } else {
                  this.setState({ isValidYouTubeLink: false });
                }
              }}
              placeholder={`https://www.youtube.com/watch?v=${id}`}
            />
            <button type="submit" className={classNames('btn', 'btn-primary')}>
              Add Video
            </button>
          </form>
          <div style={{ display: isValidYouTubeLink ? 'none' : '' }} className="url-hint">
            Not a valid youtube link.
          </div>

          <YouTube
            className="youtube-player"
            videoId={id}
            opts={opts}
            onReady={e => {
              this.setState({
                player: e.target
              });
              this.player = e.target;
              this.timeoutID = setInterval(() => {
                if (e.target.getCurrentTime() >= end) {
                  e.target.seekTo(start, true);
                }
              }, 1000);
            }}
          />

          <h3>Videos</h3>
          <Select
            clearable={false}
            value={iYouTube}
            options={options}
            onChange={o => {
              localStorage.setItem('iYouTube', o.value);
              this.setState({ iYouTube: o.value });
            }}
          />
          <h3>Looper</h3>
          <div className="slider">
            {/*<input type="checkbox" />*/}
            <span>{`${moment.unix(start).format('mm:ss')} - ${moment.unix(end).format('mm:ss')}`}</span>
            <Range
              className="range"
              min={0}
              max={duration}
              value={[start, end]}
              onChange={([start, end]) => {
                let newYouTubes = youTubes;
                newYouTubes = newYouTubes.setIn([iYouTube, 'start'], start);
                newYouTubes = newYouTubes.setIn([iYouTube, 'end'], end);
                localStorage.setItem('youTubes', JSON.stringify(newYouTubes.toJS()));
                this.setState({ youTubes: newYouTubes });
              }}
            />
          </div>
          {/*<button type="button" className="btn btn-primary">
            +
          </button>*/}
        </div>
      </div>
    );
  }
}

export default App;
