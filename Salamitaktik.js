const SetZ1HeatRequestTemperature_MQTT = 'mqtt.0.panasonic_heat_pump.commands.SetZ1HeatRequestTemperature';
const Compressor_Freq_MQTT = 'mqtt.0.panasonic_heat_pump.main.Compressor_Freq';
const ThreeWay_Valve_State_MQTT = 'mqtt.0.panasonic_heat_pump.main.ThreeWay_Valve_State';
const Main_Outlet_Temp_MQTT = 'mqtt.0.panasonic_heat_pump.main.Main_Outlet_Temp';
const Main_Inlet_Temp_MQTT = 'mqtt.0.panasonic_heat_pump.main.Main_Inlet_Temp';
const Watt1_MQTT = 'mqtt.0.panasonic_heat_pump.s0.Watt.1';
const Heat_Energy_Production_MQTT = 'mqtt.0.panasonic_heat_pump.main.Heat_Energy_Production';
const Defrosting_State_MQTT = 'mqtt.0.panasonic_heat_pump.main.Defrosting_State';

//scalieren über marking im echarts
const Timer_MS = 1000;

//startup
createState('javascript.0.VIS.cutpel', 1, {name: 'cut p electric'});
createState('javascript.0.VIS.cutpeltmax', 42, {name: 'cut p electric tmax'});
createState('javascript.0.VIS.cutpeltoff', 24, {name: 'cut p electric toff'});
createState('javascript.0.VIS.cop', 0, {name: 'cop berechnen'});
createState('javascript.0.VIS.output', "x", {name: 'x'});
createState('javascript.0.VIS.WP_T_sollVlmin', "32", {name: 'WP soll VL min'});


setInterval(f_statemachine, Timer_MS)
//var state = "state_komp_running";		//starten mit eingeschwungenem Zustand fuer Restarts
//var waitseconds = 0;
var dT = 3;
var cutpel = 1;                 
var T_Max = 42;
var T_Off = 24;
var T_sollVLmin = 32;
var Z1HeatRequestTemperature_old = 0;
//wenn dies auf 1 steht versucht er die minimale Leistung anzufahren. Man kann es auf 0 (über VIS) setzen, dann kann man auch höher Leistungen fahren indem man SetZ1HeatRequestTemperature hochzieht
//bis zu T_Max versucht er dann mindestens die minimale Leistung zu halten.

var state = "state_komp_running";		//starten mit eingeschwungenem Zustand =erste 30 Minuten fuer Restarts
var waitseconds = 0;
var s_outputold = "";
var writes = 0;

//##### set volrauf soll ###############################
/**
* @param {number} temp1
*/
function f_setvl( temp1 )
{
    let go_further = 1;
    temp1 = Math.trunc(temp1);

    if ( temp1 < T_sollVLmin)
    {
        temp1 = T_sollVLmin;
    }
	if ( temp1 > T_Max)
	{
		temp1 = T_Max;
	}
    //console.log("old " +Z1HeatRequestTemperature_old + " temp1 " + temp1 + " anzahl" + writes);
    if (temp1 != Z1HeatRequestTemperature_old)
    {
        //ungleich old und kleiner T_Max
        if (Z1HeatRequestTemperature_old < temp1)
        {
            console.log("up");
            go_further = 1;             //immer ausführen
        }
        else
        {
            console.log("down");
            if (waitseconds == 0)
            {
                waitseconds = 10*60;
                go_further = 1;         //einmal ausführen und sperren
            }
            else
            {
                go_further = 0;         //sperren bis waitseconds == 0
            }
        }
        if (cutpel == 1)
        {
            if (go_further == 1) 
            {
                setState(SetZ1HeatRequestTemperature_MQTT, temp1.toString());
                writes = writes + 1;
            }
        }
    }
    Z1HeatRequestTemperature_old = temp1;
}

//##### set volrauf soll ###############################
/**
* @param {number} temp1
*/
function f_setvlforce( temp1 )
{
    if (cutpel == 1)
    {
        setState(SetZ1HeatRequestTemperature_MQTT, temp1.toString());
        writes = writes + 1;
    }
}

/**
* @param {number} value1
* @param {number} value2
*/
function f_bigger(value1, value2)
{
	if (value1 < value2)
	{
		value1 = value2;
	}
	return value1;
}
//##### statemachine ###############################
function f_statemachine()
{
    //console.log("------------------------------");
    let Z1HeatRequestTemperature = getState(SetZ1HeatRequestTemperature_MQTT).val;
    let IS_Compressor_Freq = getState(Compressor_Freq_MQTT).val;
    let IS_Main_Outlet_Temp = getState(Main_Outlet_Temp_MQTT).val;
    let IS_Main_Inlet_Temp = getState(Main_Inlet_Temp_MQTT).val;
    let ThreeWay_Valve_State = getState(ThreeWay_Valve_State_MQTT).val;
    let Watt1 = getState(Watt1_MQTT).val;
    let Heat_Energy_Production = getState(Heat_Energy_Production_MQTT).val;
    let Defrosting_State = getState(Defrosting_State_MQTT).val;
    let Z1HeatRequestTemperature_new = 0;
    Z1HeatRequestTemperature_new = Z1HeatRequestTemperature;
    cutpel = getState('javascript.0.VIS.cutpel').val;   //über VIS = 0 keine Leistungsbegrenzung =1 Leistungsbegrenzung
    T_Max = getState('javascript.0.VIS.cutpeltmax').val;   //über VIS maximale Temperatur bis wohin er moduliert
    T_Off = getState('javascript.0.VIS.cutpeltoff').val;   //über VIS Temperatur die am Ende des Zyklusses eingestellt wird
	T_sollVLmin = getState('javascript.0.VIS.WP_T_sollVlmin').val;   //über VIS Temperatur die minimal angefahren werden soll

	//#### for all #################################################
    if (ThreeWay_Valve_State == 1) {state = "state_ww";}
    if (Defrosting_State == 1) {state = "state_defrost";}

	//#####################################################
    switch (state) 
    {
        case "state_defrost":
            if (Defrosting_State != 0) 
			{
				state = "state_ww";
			}
        break;
        //#####################################################
        case "state_off":
            if (IS_Compressor_Freq != 0) 
			{
				state = "state_ww";
			}
        break;
        //#####################################################
        case "state_ww":
            if (ThreeWay_Valve_State == 0) 
            { 
                state = "state_komp_running";
            }
        break;
        //#####################################################
        case "state_komp_running":
            if (IS_Compressor_Freq == 0) 
			{
				f_setvlforce(T_Off);
                state = "state_off";
            }
            else 
            {
				Z1HeatRequestTemperature_new = IS_Main_Inlet_Temp + dT;
				Z1HeatRequestTemperature_new = f_bigger(Z1HeatRequestTemperature_new, IS_Main_Outlet_Temp - 1);
				f_setvl(Z1HeatRequestTemperature_new);
            }
        break;
        //#####################################################
    }
        
    waitseconds -= (Timer_MS/1000);
    if (waitseconds <= 0) { 
        waitseconds = 0;
    }
    
    let s_output = "IS_Compressor_Freq="+IS_Compressor_Freq +" IS_Inlet_T="+IS_Main_Inlet_Temp +" IS_Outlet_T="+IS_Main_Outlet_Temp +" 3="+ ThreeWay_Valve_State +" wait="+waitseconds;
    s_output += " dT=" + (IS_Main_Outlet_Temp - IS_Main_Inlet_Temp) + " abst=" + (Z1HeatRequestTemperature_new - IS_Main_Outlet_Temp)+" state="+state +" VL_new="+Z1HeatRequestTemperature_new;
    s_output += " VL="+Z1HeatRequestTemperature + " cutpel=" + cutpel + " writes=" + writes;
    if (s_outputold != s_output)
    {
        s_outputold = s_output;
        console.log(s_output);
        //console.log("Watt1=" + Watt1 + " COP=" + (Heat_Energy_Production/Watt1).toFixed(2) + " cutpel=" + cutpel);
        setState('javascript.0.VIS.cop', (Heat_Energy_Production/Watt1).toFixed(2));
        setState('javascript.0.VIS.output', s_output);
    }
       
}

//event, wenn slider gelupft wird
on('javascript.0.VIS.cutpel', function (obj) {
    if (!obj.state.ack && obj.state.val) {
        //console.log("hier_mmm" + obj.state.val);
    }
    console.log("hier_sss" + obj.state.val);
    cutpel = obj.state.val;
});
