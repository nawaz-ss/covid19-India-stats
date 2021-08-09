const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

module.exports = app;

let database = null;

databasePath = path.join(__dirname, "covid19India.db");

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server running at https://localhost:3000/`);
    });
  } catch (error) {
    console.log(`DB error: "${error.message}"`);
    process.exit(1);
  }
};

initializeDbAndServer();

function convertDbObjectToResponseObject(dbObject) {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
}

function convertDbDistrictToResponseDistrict(dbDistrict) {
  return {
    districtId: dbDistrict.district_id,
    districtName: dbDistrict.district_name,
    stateId: dbDistrict.state_id,
    cases: dbDistrict.cases,
    cured: dbDistrict.cured,
    active: dbDistrict.active,
    deaths: dbDistrict.deaths,
  };
}

//API-1 get list of all states in state table
app.get("/states/", async (request, response) => {
  const getSatesQuery = `
        SELECT state_id AS stateId,
        state_name AS stateName,
        population
        FROM state
        ORDER BY state_id;`;
  const statesArray = await database.all(getSatesQuery);
  response.send(statesArray);
});

//API-2 return a state based on state_id
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT 
            state_id AS stateId,
            state_name AS stateName,
            population
        FROM state
        WHERE state_id = ${stateId};`;
  const getState = await database.get(getStateQuery);
  response.send(getState);
});

//API-3 create a district in district table
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
        INSERT INTO 
            district (district_name, state_id, cases, cured, active, deaths)
        VALUES
            ("${districtName}", ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  await database.run(postDistrictQuery);
  response.send(`District Successfully Added`);
});

//API-4 get district with district_id
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  //const {districtId, districtName, stateId, cases, cured, active, deaths} = request.body;
  const getDistrictQuery = `
        SELECT 
            district_id AS districtId,
            district_name AS districtName,
            state_id AS stateId,
            cases,
            cured,
            active,
            deaths
        FROM district 
        WHERE district_id = ${districtId};`;

  const district = await database.get(getDistrictQuery);
  response.send(district);
});

//API-5 delete a district from district table
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM district 
        WHERE district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send(`District Removed`);
});

//API-6 update a district in district table
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE district 
    SET
        district_name = "${districtName}",
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE 
        district_id= ${districtId};`;
  await database.run(updateDistrictQuery);
  response.send(`District Details Updated`);
});

//API-7 return the stats of specific state
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
        SELECT 
            SUM(cases) AS totalCases,
            SUM(cured) AS totalCured,
            SUM(active) AS totalActive,
            SUM(deaths) AS totalDeaths
        FROM district 
        GROUP BY state_id
        HAVING state_id = ${stateId};`;
  const stateStats = await database.get(getStateStatsQuery);
  response.send(stateStats);
});

//API-8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const detailsQuery = `
    SELECT 
        state.state_name AS stateName
        FROM district JOIN state ON district.state_id=state.state_id
    WHERE district.district_id = ${districtId};`;
  const getStateName = await database.get(detailsQuery);
  response.send(getStateName);
});
