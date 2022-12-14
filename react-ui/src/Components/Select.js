import React from 'react';
import queryString from 'query-string';
import Timer from './Timer';
import PlayTimer from './PlayTimer';
import Card from './Card';
import Player from './Player';
import Title from './Title'
import Directions from './Directions';
import '../App.css';
import Spotify from "spotify-web-api-js";
import Search from './Search';

const spotify = new Spotify();


class Select extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            songsList: {},
            categoryClicked: false,
            clicked: false,
            isEmptyState: true,
            isLogged: false,
            catIsLogged: false,
            renderPlayer: false,
            renderTimer: false,
            category: "",
            fetched: false,
            myCategories: ["hiphop", "pop", "toplists", "country", "rock", "rnb", "alternative", "dance", "decades", "christian", "kpop", "blues", "classical","indie","jazz","soul","punk","metal","reggae","funk"],
            gameOver:false,
            query: "",
            type: ["album"],
    };

        this.handlePlaylist = this.handlePlaylist.bind(this);
        this.handleCategory = this.handleCategory.bind(this);
        this.playAgain = this.playAgain.bind(this);
    }

    componentDidMount(){
        let parsed = queryString.parse(window.location.search); //gets access token
        let accessToken = parsed.access_token;
        spotify.setAccessToken(accessToken);

       if(!accessToken)
        return
       fetch('https://api.spotify.com/v1/me', {
         headers:{ 'Authorization': 'Bearer ' + accessToken
       }}).then(response => response.json())
       .then(data => this.setState({
           user: {
               name: data.display_name
           }
       }))

       fetch('https://api.spotify.com/v1/browse/categories?&limit=50', {
         headers:{ 'Authorization': 'Bearer ' + accessToken
       }}).then(response => response.json())
       .then(categoryData => {
        console.log(categoryData)
        let categories = categoryData.categories.items
        this.setState({
            categories: categories.map(item => {
                return {
                    name: item.name,
                    imageUrl: item.icons[0].url,
                    id: item.id
                    }
                })
            })
        })

    }

    async spotifySearchData() {
        const results = await spotify.search(this.state.query, this.state.type);
        const albumResults = await spotify.getAlbumTracks(
          results.albums.items[0].id
        );
        console.log(albumResults);
    }

    handlePlaylist(playlist) {
       console.log("clicked")
        this.setState({
            clicked: true,
            isEmptyState: false,
            songsList: playlist.songs,
            chosenPlaylist: playlist,
            imageUrl:playlist.imageUrl,
            playlists: []
        });

        setTimeout(function() { //Start the timer
            this.setState({renderPlayer: true, renderTimer: true}) //After 3 seconds, set render to true
        }.bind(this), 3000)

        setTimeout(function() {
            this.setState({renderTimer:false, gameOver: true})
        }.bind(this),123000)

    }

    playAgain(playlist) {
        console.log(this.state.songsList)
        this.setState({
            songsList: playlist.songs,
            categoryClicked: true,
            clicked: true,
            isEmptyState: false,
            isLogged: false,
            catIsLogged: false,
            renderPlayer: false,
            renderTimer: false,
            category: "",
            fetched: true,
            gameOver:false,
            chosenPlaylist: playlist,
            playlists: []
        })

        setTimeout(function() { //Start the timer
            this.setState({renderPlayer: true, renderTimer: true}) //After 3 seconds, set render to true
        }.bind(this), 3000)

        setTimeout(function() {
            this.setState({renderTimer:false, gameOver: true})
        }.bind(this),123000)
    }

    handleCategory(category) {

        let parsed = queryString.parse(window.location.search); //gets access token
        let accessToken = parsed.access_token;
        this.setState({
            categoryClicked: true,
            categoryId: category.id,
            myCategories: ["removeCategory"],
            fetched: true,
            access: parsed.acc
        });

        let url = 'https://api.spotify.com/v1/browse/categories/' + category.id + '/playlists?&limit=50'
        console.log(url)

        fetch(url, {
                headers: {'Authorization': 'Bearer ' + accessToken}
                }).then(response => response.json())
                .then(playlistData => {
                    console.log(playlistData)

                    let playlists = playlistData.playlists.items
                    let trackDataPromises = playlists.map(playlist  => {
                        let responsePromise = fetch(playlist.tracks.href, {
                        headers: {'Authorization' : 'Bearer ' + accessToken}
                        })
                        let trackDataPromise = responsePromise
                        .then(response => response.json()).catch((error) => {console.log(error)})
                        return trackDataPromise
                    })
                    let allTracksDataPromises
                        = Promise.all(trackDataPromises)
                        /*get song names, error may occur if track is null, all preview urls are null */
                    let playlistPromise = allTracksDataPromises.then(trackDatas => {

                        trackDatas.forEach((trackData, i) => {

                            console.log(trackData)
                            console.log(trackData.items.filter(function(item) {return item.track != null }))
                            console.log(trackData.items)
                            playlists[i].trackDatas = trackData.items
                                .filter(function(item) {return item.track != null })
                                .map(item => item.track)
                                .map((trackData) => ({
                                name: trackData.name,
                                url: 'trackData.preview_url',
                                uri: trackData.uri,
                                artists: trackData.artists
                            }))
                            console.log(playlists[i])
                        })
                        return playlists
                    })
                    return playlistPromise
                })
                .then(playlists => this.setState({
                    playlists: playlists.map(item => {
                        return {
                            name: item.name,
                            imageUrl: item.images[0].url,
                            songs: item.trackDatas,
                        }
                    })
                }))
                .catch((error) => {
                    console.log(error)
                })

    }

    render() {

        let categoryToRender =
        this.state.user &&
        this.state.categories
            ? this.state.categories.filter(category => {
                let matchesCategory = this.state.myCategories.includes(category.id)
                console.log(matchesCategory)
                return matchesCategory
            }) : []


        let playlistToRender =
        this.state.user &&
        this.state.playlists
            ? this.state.playlists.filter(playlist => {
                let matchesPlaylist = this.state.playlists
                return matchesPlaylist
            }) : []

        return (
        <div>
            {this.state.user ?
            [<Title/>, <div id="feedback"> <a href = "https://forms.gle/7Xdumj6rnRcgSvm96"> got feedback?</a> </div>,
            <div> {!this.state.clicked ?
             <p>
                <h1 id="welcome">
                    Welcome, {this.state.user.name.split(" ").shift()}!
                    {console.log(this.state.user)}
                </h1>
            </p>
            : this.state.gameOver ?
            <div>
            <h1 id="welcome">
            Nice Job, {this.state.user.name.split(" ").shift()}!
            {console.log(this.state.user)}
            </h1>
            <img id = "prevImg" src={this.state.imageUrl}/> </div>
            : null}

            {!this.state.clicked ? <Directions></Directions> : null}

            {
                <div id = "game">

                    {!this.state.categoryClicked && <h3> Select a category or search:  </h3> }
                    {!this.state.categoryClicked && <Search
                    search={this.state.query}
                    searchUpdate={(e) => this.setState({ query: e.target.value })}
                    typeUpdate={(e) =>
                    this.setState((state) => ({
                        type: [state.type, e.target.value],
                    }))
                    }
                    searchFunc={() => this.spotifySearchData()}
                    />}
                    
                    {this.state.categoryClicked && this.state.isEmptyState && <h3> Select a playlist:  </h3> }
                </div>
            }

            { this.state.categoryClicked ? playlistToRender.map(playlist =>
                <button className="songCard" onClick={() => this.handlePlaylist(playlist)}>

                    {this.state.clicked && !this.state.isLogged ? this.setState(
                        {
                            isLogged: true,
                        }): console.log("no playlists")
                    }
                    <Card card={playlist} />
                </button>
            ) : console.log("unclicked")}


            {
                <div id = "game">
                    {!this.state.renderTimer && !this.state.gameOver && this.state.categoryClicked && this.state.clicked ? <div>Game starts in...<Timer limit={3} ></Timer></div> : null}
                    {this.state.categoryClicked && this.state.clicked && this.state.renderTimer? <Timer limit={120}/> : null}
                    {!this.state.renderTimer && this.state.gameOver ? <div> <button id = "replay" onClick={() => {
                        this.playAgain(this.state.chosenPlaylist) }}> Play Again </button> <button id = "diffPlaylist" onClick={() => {
                            window.location = window.location.href.includes('localhost')
                              ? 'http://localhost:8888/login'
                              : 'https://song-savant.herokuapp.com/login' }} > Different Playlist</button></div> : null}
                    {this.state.clicked && this.state.renderPlayer ? <Player accessToken = {this.state.access} elementId = "myPlayer" playlist= {this.state.chosenPlaylist} selectedPlaylist = {this.state.songsList}/> : null}
                </div>
            }

            {categoryToRender.map(category =>

                    <button className="songCard" onClick={() => this.handleCategory(category)}>

                        {this.state.categoryClicked && !this.state.catIsLogged ? this.setState(
                            {
                                catIsLogged: true,
                            }): console.log(category)
                        }
                        <Card card={category} />
                    </button>
                )
            }

{
                <div>
                    {this.state.categoryClicked && this.state.isEmptyState ? <button id = "diffPlaylist" onClick={() => {
                            window.location = window.location.href.includes('localhost')
                              ? 'http://localhost:8888/login'
                              : 'https://song-savant.herokuapp.com/login' }} > Back to Categories</button> : null}
                </div>
            }


            </div>] : <div className="frontContainer"> <div id= "Neon"> GUESS THAT TUNE</div>  <div id= "desc"> how well do you know your music?</div><button id="signIn" onClick={() => {
            window.location = window.location.href.includes('localhost')
              ? 'http://localhost:8888/login'
              : 'https://song-savant.herokuapp.com/login' }
          }
          ><h3>SIGN IN WITH <span class="first">S</span>POTIFY</h3></button></div>
            }
        </div>
        );
    }
}

export default Select;
