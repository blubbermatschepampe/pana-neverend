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
//var state = "state_komp1";		//starten mit eingeschwungenem Zustand fuer Restarts
//var wait1 = 110;//15*TimerOneMinute;
var s_outputold = "";

//##### statemachine ###############################
function f_statemachine()
{
    //console.log("------------------------------");
    let TARGET_T = getState(SetZ1HeatRequestTemperature_MQTT).val;
    let TARGET_T_old = 0;
    let IS_Compressor_Freq = getState(Compressor_Freq_MQTT).val;
    let IS_Outlet_T = getState(Main_Outlet_Temp_MQTT).val;
    let IS_Inlet_T = getState(Main_Inlet_Temp_MQTT).val;
    let THREE = getState(ThreeWay_Valve_State_MQTT).val;

	//#### for all #################################################
    if (THREE == 1) {state = "state_ww";}

	//#####################################################
    if (state == "state_off")
    {
        if (IS_Compressor_Freq != 0) {state = "state_ww";}
    }
	//#####################################################
    else if (state == "state_ww")
    {
        if (THREE == 0) 
		{ 
			state = "state_komp1";
            wait1 = 30*TimerOneMinute;
		}
    }
	//#####################################################
    else if (state == "state_komp1")
	{
        if (IS_Outlet_T >= TARGET_T + 1.5)
		{
			TARGET_T = IS_Outlet_T;
			setState(SetZ1HeatRequestTemperature_MQTT, TARGET_T);
            console.log("hier4+");
		}
        if (TARGET_T - IS_Inlet_T <= dT + 1)
		{
			TARGET_T = IS_Inlet_T + dT + 1;
			setState(SetZ1HeatRequestTemperature_MQTT, TARGET_T);
            console.log("hier5+");
		}
        if (IS_Compressor_Freq >= 26) {
            if (TARGET_T > IS_Outlet_T){
                TARGET_T = IS_Outlet_T;
                setState(SetZ1HeatRequestTemperature_MQTT, TARGET_T);
                console.log("hier65-");
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
            TARGET_T = 24;
            setState(SetZ1HeatRequestTemperature_MQTT, TARGET_T);
            console.log("hier3-");
            state = "state_off";
        }
        else if (IS_Compressor_Freq <= 22)
        {
            if  (IS_Outlet_T >= TARGET_T + 1.5) {
                TARGET_T = TARGET_T + 1;
                if (TARGET_T < IS_Outlet_T + 1.5) {
                    //TARGET_T = IS_Outlet_T;
                    console.log("hier1+");
                }
                if (TARGET_T <= 42) {
                    setState(SetZ1HeatRequestTemperature_MQTT, TARGET_T);
                    console.log("hier2+");
                }
            }
            if (TARGET_T - IS_Inlet_T < dT) {
                //mindestens 4 Grad fuer DeltaT setzen
                TARGET_T = IS_Inlet_T + dT;
                //setState(SetZ1HeatRequestTemperature_MQTT, TARGET_T);
                console.log("hier6+");
                if (TARGET_T <= 42) {
                    setState(SetZ1HeatRequestTemperature_MQTT, TARGET_T);
                    console.log("hier7+");
                }
            }
        }
        else if ((IS_Compressor_Freq >= 26) && (begrenzung == 1))
        {
            TARGET_T_old = TARGET_T;
            if (TARGET_T - IS_Inlet_T > dT + 1 ) {
                //mindestens 4 Grad fuer DeltaT setzen
                TARGET_T = IS_Inlet_T + dT + 0.5;

                if (TARGET_T < IS_Outlet_T - 1) {
                    //höchstens 1 Grad unter IS_Outlet_T nicht tiefer
                    TARGET_T = IS_Outlet_T - 1;
                }

                console.log("hier8-");
                if ((TARGET_T <= 42) && (TARGET_T < TARGET_T_old)) {
                    setState(SetZ1HeatRequestTemperature_MQTT, TARGET_T);
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
    
    let s_output = "IS_Compressor_Freq="+IS_Compressor_Freq +" IS_Inlet_T="+IS_Inlet_T +" IS_Outlet_T="+IS_Outlet_T +" TARGET_T="+TARGET_T +" 3="+ THREE +" wait1="+wait1 +" state="+state;
    s_output += " dT=" + (IS_Outlet_T - IS_Inlet_T) + " abst=" + (TARGET_T - IS_Outlet_T)
    if (s_outputold != s_output)
    {
        s_outputold = s_output;
        console.log(s_output);
    }
        
}