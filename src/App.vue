<template>
  <div id="app">
    <div id="background"></div>
    <h1>Capgemini Environmental Impact Dashboard.</h1>

    <h2 class="sectionHeadline">Your Entire Building.</h2>
    <div class="kpis">

        <b-tooltip position="is-bottom" label="Current Energy Consumption">
          <div class="kpi">
            <div class="kpiIcon">
              <i class="fal fa-plug"></i>
            </div>
            <div class="value">
              {{ apiData.building.totalPowerConsumption || "....." }} kW
            </div>
          </div>
      </b-tooltip>
      <b-tooltip position="is-bottom" label="Data Center Energy Consumption">
        <div class="kpi">
          <div class="kpiIcon">
            <i class="fal fa-server"></i>
          </div>
          <div class="value">
            {{ apiData.building.powerConsumptionDataCenter || "....." }} kW
          </div>
        </div>
    </b-tooltip>
    <b-tooltip position="is-bottom" label="Solar Energy Production">
      <div class="kpi">
        <div class="kpiIcon">
          <i class="fal fa-solar-panel"></i>
        </div>
        <div class="value">
          {{ apiData.building.solarPowerOutput }} kW
        </div>
      </div>
  </b-tooltip>
  <b-tooltip position="is-bottom" label="Current Water Consumption">
    <div class="kpi">
      <div class="kpiIcon">
        <i class="fal fa-faucet-drip"></i>
      </div>
      <div class="value">
        {{ apiData.building.waterConsumption || 0 }} l
      </div>
    </div>
</b-tooltip>
    </div>
    <h2 class="sectionHeadline">Roomwise Breakdown.</h2>
    <div class="rooms">
      <div class="room" v-for="(room, index) in rankedRooms" :key="room.id">
        <div class="roomHeader">
          <div class="roomTitle" :class="{'isGreen': index == 0 || (room.score == 100), 'isRed': getWarnings(room).length>0}"> {{room.id}}</div>
          <div class="roomEcoPoints">
            <i class="fal fa-leaf"></i>
            {{ room.score.toFixed(0) }}%
            <i class="fal fa-medal"></i>
            {{index+1}}
          </div>
        </div>
        <div class="roomDetails">
          <div class="roomDetail">
            <i class="fal fa-lightbulb-on"></i> <span class="name">Light</span>: {{ room.sensors.lightOn? 'On' : 'Off' }}
          </div>
          <div class="roomDetail">
            <i class="fal fa-window-frame-open"></i> <span class="name">Windows</span>: {{ room.sensors.windowsOpen? 'Open' : 'Closed' }}
          </div>
          <div class="roomDetail">
            <i class="fal fa-air-conditioner"></i> <span class="name">AC</span>: {{ room.sensors.airConditioningRunning? 'Running' : 'Off' }}
          </div>
          <div class="roomDetail">
            <i class="fal fa-heat"></i> <span class="name">Heater</span>: {{ room.sensors.heaterRunning? 'Running' : 'Off' }}
          </div>
          <div class="roomDetail">
            <i class="fal fa-thermometer-quarter"></i> <span class="name">Temperature</span>: {{ room.temperature.toFixed(1) }}°C 
          </div>
          <div class="roomDetail">
            <i class="fal fa-thermometer-quarter"></i> <span class="name">Power Consumption</span>: {{ room.powerConsumption.toFixed(2) }} kW
          </div>
          <div class="roomDetail">
            <i class="fal fa-users"></i> <span class="name">Reservations</span>: {{ room.workplaceReservations }}
          </div>
        </div>
          <div class="warning" v-if="getWarnings(room).length>0">
            <div v-for="warning in getWarnings(room)" :key="warning.id"><i class="fal fa-exclamation-triangle"></i>{{ warningStrings[warning] }}</div>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
// import { Line } from 'vue-chartjs'
import axios from "axios"
import _ from 'lodash'

const warningStrings = {
  "W+AC": "Window open & AC running!",
  "W+Heater": "Window open & Heater running!",
  "Heater+Empty": "Heater running & Office unoccupied!",
  "AC+Empty": "AC running & Office unoccupied!",
  "Light+Empty": "Lights on & Office unoccupied!"
}
export default {
  name: 'App',
  data(){
    return {
      warningStrings: warningStrings,
      reloadInterval: null,
      rooms: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
      datacollection: null,
      apiData: {
        building: {
          powerConsumption: "..."
        },
        rooms: []
      }
    }
  },
  methods: {
    fetchData(){
      axios
         .get("api/live-data")
         .then((response) => {

           this.apiData = response.data
           this.apiData.rooms.forEach(room => {
             room.score = this.getScore(room)
           })
      })
    },
    getWarnings(roomData){
      const warnings = []
      if(roomData.sensors.windowsOpen && roomData.sensors.airConditioningRunning)warnings.push("W+AC")
      if(roomData.sensors.windowsOpen && roomData.sensors.heaterRunning)warnings.push("W+Heater")
      if(roomData.workplaceReservations == 0 && roomData.sensors.heaterRunning)warnings.push("Heater+Empty")
      if(roomData.workplaceReservations == 0 && roomData.sensors.airConditioningRunning)warnings.push("AC+Empty")
      if(roomData.workplaceReservations == 0 && roomData.sensors.lightOn)warnings.push("Light+Empty")
      return warnings
    },
    getScore(roomData){
      const noWarnings = this.getWarnings(roomData).length

      let heatingTempBonus = 0.2
      if(roomData.sensors.heaterRunning){
        if(roomData.temperature > 21){
          heatingTempBonus = -0.2
        }
        if(roomData.temperature > 20){
          heatingTempBonus = -0.15
        }
        else if(roomData.temperature > 19.5){
          heatingTempBonus = 0
        }
        else if(roomData.temperature > 19){
          heatingTempBonus = 0.05
        }
        else if(roomData.temperature > 18.5){
          heatingTempBonus = 0.1
        }
      }
      let acTempBonus = 0.2
      if(roomData.sensors.airConditioningRunning){
        if(roomData.temperature < 19){
          acTempBonus = -0.2
        }
        else if(roomData.temperature < 20){
          acTempBonus = -0.1
        }
      }

      let powerConsBonus = 0.2
      if(roomData.powerConsumption){
        if(roomData.powerConsumption > 2){
          powerConsBonus = -0.3
        }
        else if(roomData.powerConsumption > 1.8){
          powerConsBonus = -0.2
        }
        else if(roomData.powerConsumption > 1.7){
          powerConsBonus = -0.1
        }
        else if(roomData.powerConsumption > 1.6){
          powerConsBonus = 0.0
        }
        else if(roomData.powerConsumption > 1.5){
          powerConsBonus = 0.1
        }
      }

      return Math.min(1, Math.max(0.6 - 0.4 * noWarnings + heatingTempBonus + acTempBonus + powerConsBonus, 0)) * 100

    }
  },
  computed: {
    rankedRooms(){

      if(this.apiData && this.apiData.rooms){
        return _.orderBy(this.apiData.rooms, 'score', 'desc')
      }
      else {
        return []
      }
    }
  },
  async created(){
      this.fetchData()
      this.reloadInterval = setInterval(() => this.fetchData(), 30000)
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap');
#app {
  font-family: Verdana, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
#background {
  background: #FF0A5E;
  background: -webkit-linear-gradient(top left, #FF0A5E, #D0E931);
  background: -moz-linear-gradient(top left, #FF0A5E, #D0E931);
  background: linear-gradient(to bottom right, #FF0A5E, #D0E931);
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
  top: 0;
  left: 0;
  z-index: -1;
  position: fixed;
}
#app h1, #app h2 {
  font-family: 'Ubuntu', sans-serif;
  font-weight: 700;
  color: white;
  font-size: 40px;
  margin-left: 25px;
}
#app h1 {
  margin-top: 20px;
}
#app h2 {
  font-size: 30px;
}
.roomTitle {
  font-family: 'Ubuntu', sans-serif;
  font-weight: 700;
  font-size: 25px;
  color: rgb(50, 50, 50);
  text-align: center;
}
.rooms {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin: 0 15px;
  justify-content: space-between;
}
.room {
  width: 350px;
  height: 220px;
  background: rgba(255,255,255,0.95);
  margin: 10px;
  border-radius: 15px;
  box-shadow:  6px 6px 20px rgba(78,78,78,0.4);
  position: relative;
}
.roomHeader {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  margin-left: 15px;
  margin-top: 5px;
}
.roomHeader .isGreen {
  color: green;
}
.roomHeader .isRed {
  color: red;
}
.roomHeader i {
  margin-left: 15px;
}
.warning {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  min-height: 30px;
  background: white;
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 15px;
  text-align: center;
  font-size: 10px;
  color: red;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.warning i {
  margin-right: 5px;
}
.kpis {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin: 15px 25px;
  justify-content:space-around;
  background: rgba(255,255,255,0.95);
  border-radius: 15px;
  box-shadow:  6px 6px 20px rgba(78,78,78,0.4);
}
.kpi {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
  margin-left: 15px;
  margin-top: 30px;
  margin-bottom: 20px;
}
.kpiIcon {
  border: 3px solid rgba(0,0,0,0.5);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  color: rgba(0,0,0,0.8);
  text-align: center;
}
.kpiIcon i {
  font-size: 30px;
  line-height: 60px;
}
.kpi .value {
  font-size: 24px;
  font-family: 'Ubuntu', sans-serif;
  font-weight: 700;
  color: rgba(0,0,0,0.8);
  margin-top: 10px;
}
.sectionHeadline {
  margin-top: 40px;
  margin-bottom: 30px;
}
.roomDetails {
  margin-left: 30px;
  margin-right: 10px;
  margin-top: 5px;
  font-size: 13px;
}
.roomDetails i {
  min-width: 20px;
}
.roomDetails .name {
  font-family: 'Ubuntu', sans-serif;
  font-weight: 700;
}
</style>
