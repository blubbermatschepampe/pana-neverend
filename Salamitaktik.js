const SetZ1HeatRequestTemperature_MQTT = 'mqtt.0.panasonic_heat_pump.commands.SetZ1HeatRequestTemperature';
const Compressor_Freq_MQTT = 'mqtt.0.panasonic_heat_pump.main.Compressor_Freq';
const ThreeWay_Valve_State_MQTT = 'mqtt.0.panasonic_heat_pump.main.ThreeWay_Valve_State';
const Main_Outlet_Temp_MQTT = 'mqtt.0.panasonic_heat_pump.main.Main_Outlet_Temp';
const Main_Inlet_Temp_MQTT = 'mqtt.0.panasonic_heat_pump.main.Main_Inlet_Temp';
const Watt1_MQTT = 'mqtt.0.panasonic_heat_pump.s0.Watt.1';
const Heat_Energy_Production_MQTT = 'mqtt.0.panasonic_heat_pump.main.Heat_Energy_Production';
const Defrosting_State_MQTT = 'mqtt.0.panasonic_heat_pump.main.Defrosting_State';
const AT_MQTT = 'mqtt.0.panasonic_heat_pump.main.Outside_Temp';

//scalieren über marking im echarts
const Timer_MS = 1000;

//startup
createState('javascript.0.VIS.cutpel', 1, {name: 'cut p electric'});
createState('javascript.0.VIS.cutpeltmax', 42, {name: 'cut p electric tmax'});
createState('javascript.0.VIS.cutpeltoff', 24, {name: 'cut p electric toff'});
createState('javascript.0.VIS.cop', 0, {name: 'cop berechnen'});
createState('javascript.0.VIS.output', "x", {name: 'x'});
//createState('javascript.0.VIS.WP_T_sollVlmin', "32", {name: 'WP soll VL min'});

createState('javascript.0.VIS.WP_T_SWV' , 0, {name: ''});
createState('javascript.0.VIS.WP_T_VL_10' , 32, {name: ''});
createState('javascript.0.VIS.WP_T_VL_5'  , 34, {name: ''});
createState('javascript.0.VIS.WP_T_VL_0'  , 36, {name: ''});
createState('javascript.0.VIS.WP_T_VL_M5' , 38, {name: ''});
createState('javascript.0.VIS.WP_T_VL_M10', 40, {name: ''});
createState('javascript.0.VIS.WP_T_VL_M15', 42, {name: ''});

setInterval(f_statemachine, Timer_MS)

let dT = 2;
let cutpel = 1;                 
let T_Max = 42;
let T_Off = 24;
let T_heizkurve = 32;       //Heizkurve
let Z1HeatRequestTemperature = 0;

let WP_T_VL_10;
//wenn dies auf 1 steht versucht er die minimale Leistung anzufahren. Man kann es auf 0 (über VIS) setzen, dann kann man auch höher Leistungen fahren indem man SetZ1HeatRequestTemperature hochzieht
//bis zu T_Max versucht er dann mindestens die minimale Leistung zu halten.

let state = "state_komp_running";		//starten mit eingeschwungenem Zustand =erste 30 Minuten fuer Restarts
let waitseconds = 0;
let s_outputold = "";
let writes = 0;

//##### set volrauf soll ###############################
/**
* @param {number} temp1
*/
function f_setvl( temp1 )
{
    let go_further = 1;
    temp1 = Math.trunc(temp1);

    if ( temp1 < T_heizkurve)
    {
        temp1 = T_heizkurve;
    }
	if ( temp1 > T_Max)
	{
		temp1 = T_Max;
	}
    console.log("z1 " +Z1HeatRequestTemperature + " temp1 " + temp1 + " writes" + writes);
    if (temp1 != Z1HeatRequestTemperature)
    {
        //ungleich old und kleiner T_Max
        if (Z1HeatRequestTemperature < temp1)
        {
            console.log("up");
            go_further = 1;             //immer ausführen
        }
        else
        {
            console.log("down");
            if (waitseconds == 0)
            {
                waitseconds = 1*60;
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
/**
* @param {number} value1
* @param {number} value2
*/
function f_smaller(value1, value2)
{
	if (value1 > value2)
	{
		value1 = value2;
	}
	return value1;
}
//##### statemachine ###############################
function f_statemachine()
{
    //console.log("------------------------------");
    Z1HeatRequestTemperature = getState(SetZ1HeatRequestTemperature_MQTT).val;
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
    let T_AT = getState(AT_MQTT).val;

    if (T_AT >= 10)
        {T_heizkurve = getState('javascript.0.VIS.WP_T_VL_10').val;}
    else if (T_AT >= 5)
	    {T_heizkurve = getState('javascript.0.VIS.WP_T_VL_5').val;}
    else if (T_AT >= 0)
	    {T_heizkurve = getState('javascript.0.VIS.WP_T_VL_0').val;}
    else if (T_AT >= -5)
	    {T_heizkurve = getState('javascript.0.VIS.WP_T_VL_M5').val;}
    else if (T_AT >= -10)
	    {T_heizkurve = getState('javascript.0.VIS.WP_T_VL_M10').val;}
    else
	    {T_heizkurve = getState('javascript.0.VIS.WP_T_VL_M15').val;}
    T_heizkurve += getState('javascript.0.VIS.WP_T_SWV').val;
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
                if (IS_Compressor_Freq <= 20)
                {
                    Z1HeatRequestTemperature_new = IS_Main_Inlet_Temp + dT;
                    Z1HeatRequestTemperature_new = f_bigger(Z1HeatRequestTemperature_new, IS_Main_Outlet_Temp - 1);
                    // outlet outlet-1 trunc diff 
                    // 30     29       29    1        ok
                    // 30,25  29,25    29    1,25     ok
                    // 30,5   29,5     29    1,5      nok
                    // 30,75  29,75    29    1,75     nok
                    Z1HeatRequestTemperature_new = Math.trunc(Z1HeatRequestTemperature_new);
                    if (IS_Main_Outlet_Temp - Z1HeatRequestTemperature_new >= 1.5)
                    {
                        Z1HeatRequestTemperature_new = Z1HeatRequestTemperature_new + 1;            //wieder einen erhöhen
                    }
                }
                else if (IS_Compressor_Freq <= 50)
                {
                    Z1HeatRequestTemperature_new = IS_Main_Inlet_Temp + dT - 1;                                          //wir haben noch nicht total begrenzt können dT etwas reduzieren
                    Z1HeatRequestTemperature_new = f_bigger(Z1HeatRequestTemperature_new, IS_Main_Outlet_Temp - 1);
                }
                else
                {
                    Z1HeatRequestTemperature_new = IS_Main_Inlet_Temp + dT - 1;                                          //wir haben noch nicht total begrenzt können dT etwas reduzieren
                    Z1HeatRequestTemperature_new = f_bigger(Z1HeatRequestTemperature_new, IS_Main_Outlet_Temp - 1);
                    //Z1HeatRequestTemperature_new = f_smaller(T_heizkurve, Z1HeatRequestTemperature_new);
                }
				f_setvl(Z1HeatRequestTemperature_new);
            }
        break;
        //#####################################################
    }
        
    waitseconds -= (Timer_MS/1000);
    if (waitseconds <= 0) { 
        waitseconds = 0;
    }
    
    let s_output = "Freq="+IS_Compressor_Freq +" IS_Inlet_T="+IS_Main_Inlet_Temp +" IS_Outlet_T="+IS_Main_Outlet_Temp +" 3="+ ThreeWay_Valve_State +" wait="+waitseconds;
    s_output += " dT=" + (IS_Main_Outlet_Temp - IS_Main_Inlet_Temp) + " abst=" + (Z1HeatRequestTemperature_new - IS_Main_Outlet_Temp)+" state="+state +" VL_new="+Z1HeatRequestTemperature_new;
    s_output += " VL="+Z1HeatRequestTemperature + " cutpel=" + cutpel + " writes=" + writes;
    s_output += " K="+ T_heizkurve;
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
    waitseconds = 0;
});
