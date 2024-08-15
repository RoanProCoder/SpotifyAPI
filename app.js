require('dotenv').config(); // Load environment variables from a .env file
const fs = require('fs'); // File system module to read files
const readline = require('readline'); // Module to read input line-by-line
const readlineSync = require('readline-sync'); // Module for synchronous readline input
const SpotifyWebApi = require('spotify-web-api-node'); // Spotify API client module
const textfile = 'random.txt'; // Path to the text file

// Configure the Spotify API client using environment variables
const spotifyApi = new SpotifyWebApi(
{
  clientId: process.env.ID_SPOTIFY,
  clientSecret: process.env.CLIENT_SPOTIFY_SECRET
});

// Function to get the access token
async function getAccessToken() 
{
  try 
  {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
  } 
  catch (error) 
  {
    console.error('An error occurred when retrieving the access token: ' + error);
  }
}

// Function to get track information by track ID
async function getTrackInfo(trackId) 
{
  try 
  {
    const data = await spotifyApi.getTrack(trackId);
    const track = data.body;
    const result = 
    {
      artist: track.artists.map(artist => artist.name).join(', '),
      song: track.name,
      preview_link: track.preview_url ? track.preview_url : 'No preview available',
      album: track.album.name
    };
    console.log(result);
  } 
  catch (error) 
  {
    console.error('An error occurred when fetching the song details: ' + error);
  }
}

// Function to get song ID by song name
async function getSongId(songName) 
{
  try 
  {
    const data = await spotifyApi.searchTracks(`track:${songName}`);
    if (data.body.tracks.items.length > 0) 
    {
      const songId = data.body.tracks.items[0].id;
      console.log(`Song ID for "${songName}": ${songId}`);
      return songId;
    } 
    else 
    {
      console.log(`No song found with the name "${songName}"`);
      return null;
    }
  } catch (error) 
  {
    console.error('Something went wrong when searching for the song!' + error);
    return null;
  }
}

// Function to read the first three lines from a file
async function readFromFile(filePath) 
{
  return new Promise((resolve, reject) => 
  {
    const fileStream = fs.createReadStream(filePath); // Create a read stream for the file

    const rl = readline.createInterface(
    {
      input: fileStream,
      crlfDelay: Infinity
    });

    let lines = [];
    rl.on('line', (line) => 
    { // Event listener for each line read
      if (lines.length < 3) 
        lines.push(line); // Add the line to the array if less than 3 lines have been read
      if (lines.length === 3) 
        rl.close(); // Close the readline interface after reading 3 lines
    });

    rl.on('close', () => { // Event listener for when the readline interface closes
      if (lines.length < 3) 
        reject(new Error('File has fewer than 3 lines')); // Reject the promise if fewer than 3 lines
      else 
        resolve(lines); // Resolve the promise with the 3 lines
    });

    rl.on('error', (error) => 
    { // Event listener for any errors
      reject(error);
    });
  });
}

// Function to get artist ID by name using lines from the text file
async function textFileArtist() 
{
  try 
  {
    const lines = await readFromFile(textfile);
    const [line1, line2, line3] = lines;

    const data = await spotifyApi.searchArtists(line1);
    if (data.body.artists.items.length > 0) 
    {
      const artistId = data.body.artists.items[0].id;
      console.log(`Artist ID for ${line1}: ${artistId}`);
    } 
    else 
      console.log(`${line2} ${line1}`);
  } 
  catch (error) 
  {
    console.error(`${error}`);
  }
}

// Function to display the menu and handle user input
async function menu() 
{
  console.log(menuData()); // Display the menu options
  const num = readlineSync.question('Enter the number you want to run: '); // Get user input
  const number = parseInt(num); // Parse the input to an integer

  switch (number) 
  {
    case MenuOptions.Song:
      await song(); // Handle song option
      break;
    case MenuOptions.TextFile:
      await textFileArtist(); // Handle text file option
      break;
    case MenuOptions.Exit:
      process.exit(0); // Exit the program
    default:
      console.log('Please enter a valid number.'); // Handle invalid input
  }
}

// Function to generate menu options text
function menuData() 
{
  var line = "\n";
  line += "1. Enter Song Name to Search:\n";
  line += "2. Run Text File Command:\n";
  line += "3. Exit\n";
  return line;
}

// Function to handle song input and fetching details
async function song() 
{
  const songName = readlineSync.question('Enter the song name: '); // Get song name from user
  const songId = await getSongId(songName); // Get the song ID

  if (songId) {
    await getTrackInfo(songId); // Get and display track information if song ID is found
  }
}

// Main function to execute the program
async function main() 
{
  await getAccessToken(); // Get the Spotify access token
  while (true) 
    await menu(); // Continuously display the menu
}

const MenuOptions = 
{
  Song: 1,
  TextFile: 2,
  Exit: 3
};

main(); // Start the program
