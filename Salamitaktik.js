const SetZ1HeatRequestTemperature_MQTT = 'mqtt.0.panasonic_heat_pump.commands.SetZ1HeatRequestTemperature';
const Compressor_Freq_MQTT = 'mqtt.0.panasonic_heat_pump.main.Compressor_Freq';
const ThreeWay_Valve_State_MQTT = 'mqtt.0.panasonic_heat_pump.main.ThreeWay_Valve_State';
const Main_Outlet_Temp_MQTT = 'mqtt.0.panasonic_heat_pump.main.Main_Outlet_Temp';
const Main_Inlet_Temp_MQTT = 'mqtt.0.panasonic_heat_pump.main.Main_Inlet_Temp';
const Timer_MS = 10000;
//const TimerOneSecond = 1000/10000;
const TimerOneMinute = 1000*60/10000;

//startup
setInterval(f_statemachine, Timer_MS)
var state = "state_komp2";		//starten mit eingeschwungenem Zustand fuer Restarts
var wait1 = 1;
var dT = 3;
var begrenzung = 1;                 
var T_Max = 42
//wenn dies auf 1 steht versucht er die minimale Leistung anzufahren. Man kann es auf 0 setzen, dann kann man auch höher Leistungen fahren indem man SetZ1HeatRequestTemperature hochzieht
//bis zu T_Max versucht er dann mindestens die minimale Leistung zu halten.

//var state = "state_komp1";		//starten mit eingeschwungenem Zustand =erste 30 Minuten fuer Restarts
//var wait1 = 110;//15*TimerOneMinute;
var s_outputold = "";

//##### statemachine ###############################
function f_statemachine()
{
    //console.log("------------------------------");
    let Z1HeatRequestTemperature = getState(SetZ1HeatRequestTemperature_MQTT).val;
    let Z1HeatRequestTemperature_old = 0;
    let IS_Compressor_Freq = getState(Compressor_Freq_MQTT).val;
    let IS_Main_Outlet_Temp = getState(Main_Outlet_Temp_MQTT).val;
    let IS_Main_Inlet_Temp = getState(Main_Inlet_Temp_MQTT).val;
    let ThreeWay_Valve_State = getState(ThreeWay_Valve_State_MQTT).val;

	//#### for all #################################################
    if (ThreeWay_Valve_State == 1) {state = "state_ww";}

	//#####################################################
    if (state == "state_off")
    {
        if (IS_Compressor_Freq != 0) {state = "state_ww";}
    }
	//#####################################################
    else if (state == "state_ww")
    {
        if (ThreeWay_Valve_State == 0) 
		{ 
			state = "state_komp1";
            wait1 = 30*TimerOneMinute;
		}
    }
	//#####################################################
    else if (state == "state_komp1")
	{
        if (IS_Main_Outlet_Temp >= Z1HeatRequestTemperature + 1.5)
		{
			Z1HeatRequestTemperature = IS_Main_Outlet_Temp;
			setState(SetZ1HeatRequestTemperature_MQTT, Z1HeatRequestTemperature);
            console.log("hier58+");
		}
        if (Z1HeatRequestTemperature - IS_Main_Inlet_Temp <= dT + 1)
		{
			Z1HeatRequestTemperature = IS_Main_Inlet_Temp + dT + 1;
			setState(SetZ1HeatRequestTemperature_MQTT, Z1HeatRequestTemperature);
            console.log("hier5+");
		}
        if (IS_Compressor_Freq >= 26) {
            if (Z1HeatRequestTemperature > IS_Main_Outlet_Temp){
                Z1HeatRequestTemperature = IS_Main_Outlet_Temp;
                setState(SetZ1HeatRequestTemperature_MQTT, Z1HeatRequestTemperature);
                console.log("hier70-");
            }
        }
        if (IS_Compressor_Freq == 0) {
            state = "state_off";
        }

        wait1--;
        if (wait1<=0)
        {
		    state = "state_komp2";
        }
	}
	//#####################################################
    else if (state == "state_komp2")
    {
        if (IS_Compressor_Freq == 0) {
            Z1HeatRequestTemperature = 24;
            setState(SetZ1HeatRequestTemperature_MQTT, Z1HeatRequestTemperature);
            console.log("hier3-");
            state = "state_off";
        }
        else if (IS_Compressor_Freq <= 22)
        {
            if  (IS_Main_Outlet_Temp >= Z1HeatRequestTemperature + 1.5) {
                Z1HeatRequestTemperature = Z1HeatRequestTemperature + 1;
                if (Z1HeatRequestTemperature < IS_Main_Outlet_Temp + 1.5) {
                    console.log("hier98+");
                }
                if (Z1HeatRequestTemperature <= T_Max) {
                    setState(SetZ1HeatRequestTemperature_MQTT, Z1HeatRequestTemperature);
                    console.log("hier102+");
                }
            }
            if (Z1HeatRequestTemperature - IS_Main_Inlet_Temp < dT) {
                //mindestens 4 Grad fuer DeltaT setzen
                Z1HeatRequestTemperature = IS_Main_Inlet_Temp + dT;
                console.log("hier109+");
                if (Z1HeatRequestTemperature <= T_Max) {
                    setState(SetZ1HeatRequestTemperature_MQTT, Z1HeatRequestTemperature);
                    console.log("hier112+");
                }
            }
        }
        else if ((IS_Compressor_Freq >= 26) && (begrenzung == 1))
        {
            Z1HeatRequestTemperature_old = Z1HeatRequestTemperature;
            if (Z1HeatRequestTemperature - IS_Main_Inlet_Temp > dT + 1 ) {
                //mindestens dT Grad fuer DeltaT setzen
                Z1HeatRequestTemperature = IS_Main_Inlet_Temp + dT + 0.5;

                if (Z1HeatRequestTemperature < IS_Main_Outlet_Temp - 1) {
                    //höchstens 1 Grad unter IS_Outlet_T nicht tiefer
                    Z1HeatRequestTemperature = IS_Main_Outlet_Temp - 1;
                }

                console.log("hier128-");
                if ((Z1HeatRequestTemperature <= T_Max) && (Z1HeatRequestTemperature < Z1HeatRequestTemperature_old)) {
                    setState(SetZ1HeatRequestTemperature_MQTT, Z1HeatRequestTemperature);
                    console.log("hier9-");
                }
            }
        }
    }
	//#####################################################
    else if (state == "state_wait")
    {
        wait1 -= Timer_MS;
        if (wait1 <= 0) { state = "state_komp"}
    }
    
    let s_output = "IS_Compressor_Freq="+IS_Compressor_Freq +" IS_Inlet_T="+IS_Main_Inlet_Temp +" IS_Outlet_T="+IS_Main_Outlet_Temp +" Z1HeatRequestTemperature="+Z1HeatRequestTemperature +" 3="+ ThreeWay_Valve_State +" wait1="+wait1 +" state="+state;
    s_output += " dT=" + (IS_Main_Outlet_Temp - IS_Main_Inlet_Temp) + " abst=" + (Z1HeatRequestTemperature - IS_Main_Outlet_Temp)
    if (s_outputold != s_output)
    {
        s_outputold = s_output;
        console.log(s_output);
    }
        
}
