const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

initializeDBAndServer();

//GET players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT player_id as playerId , player_name as playerName
     FROM player_details
     ORDER BY player_id;`;
  let playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

//GET player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT player_id as playerId , player_name as playerName
     FROM player_details
     WHERE player_id = ${playerId};`;
  let player = await db.get(getPlayerQuery);
  response.send(player);
});

//Update player details
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `UPDATE player_details 
     SET player_name = '${playerName}'
     WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//GET match details of a particular match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `SELECT match_id as matchId , match , year
     FROM match_details
     WHERE match_id = ${matchId};`;
  let matchDetails = await db.get(getMatchDetailsQuery);
  response.send(matchDetails);
});

//GET list of matches of a player API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getListOfMatchesOfAPlayer = `SELECT match_id as matchId , match , year
     FROM match_details 
     WHERE match_id IN (SELECT match_id 
                        FROM player_match_score 
                        WHERE player_id = ${playerId}
     );`;
  const playerMatchesArray = await db.all(getListOfMatchesOfAPlayer);
  response.send(playerMatchesArray);
});

//GET list of players of a specific match API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getListOfPlayersOfAMatch1 = `
    SELECT player_details.player_id as playerId , player_details.player_name as playerName
    FROM player_details NATURAL JOIN player_match_score
    WHERE player_match_score.match_id = ${matchId};
  `;

  const getListOfPlayersOfAMatch = `SELECT player_id as playerId , player_name as playerName
     FROM player_details 
     WHERE player_id IN (SELECT player_id 
                        FROM player_match_score 
                        WHERE match_id = ${matchId}
     );`;
  const matchPlayersArray = await db.all(getListOfPlayersOfAMatch1);
  response.send(matchPlayersArray);
});

//GET statistics of a player API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatisticsQuery = `SELECT 
            player_details.player_id as playerId,
            player_details.player_name as playerName,
            sum(player_match_score.score) as totalScore,
            sum(player_match_score.fours) as totalFours,
            sum(player_match_score.sixes) as totalSixes
     FROM player_details NATURAL JOIN player_match_score 
     WHERE player_id = ${playerId};`;
  const playerDetails = await db.get(getPlayerStatisticsQuery);
  response.send(playerDetails);
});

module.exports = app;
