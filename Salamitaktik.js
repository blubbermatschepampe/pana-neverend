const SetZ1HeatRequestTemperature_MQTT = 'mqtt.0.panasonic_heat_pump.commands.SetZ1HeatRequestTemperature';
const Compressor_Freq_MQTT = 'mqtt.0.panasonic_heat_pump.main.Compressor_Freq';
const ThreeWay_Valve_State_MQTT = 'mqtt.0.panasonic_heat_pump.main.ThreeWay_Valve_State';
const Main_Outlet_Temp_MQTT = 'mqtt.0.panasonic_heat_pump.main.Main_Outlet_Temp';
const Main_Inlet_Temp_MQTT = 'mqtt.0.panasonic_heat_pump.main.Main_Inlet_Temp';
//const Watt1_MQTT = 'mqtt.0.panasonic_heat_pump.s0.Watt.1';
//const Heat_Power_Production_MQTT = 'mqtt.0.panasonic_heat_pump.main.Heat_Power_Production';
//const DHW_Power_Production_MQTT = 'mqtt.0.panasonic_heat_pump.main.DHW_Power_Production';
const Defrosting_State_MQTT = 'mqtt.0.panasonic_heat_pump.main.Defrosting_State';
const AT_MQTT = 'mqtt.0.panasonic_heat_pump.main.Outside_Temp';
const Operating_Mode_State_MQTT = 'mqtt.0.panasonic_heat_pump.main.Operating_Mode_State';

//scalieren über marking im echarts
const Timer_MS = 1000;

//startup
//die folgenden createState koennen als slider im Vis angelegt werden und dienen dann der Eingabe von Werten
createState('javascript.0.VIS.cutpel', 1, {name: 'cut p electric'});                //werte Skript aus =0 und Skript läuft =1 
createState('javascript.0.VIS.cutpeltmax', 42, {name: 'cut p electric tmax'});      //maximale Temperatur bis zu der die WP hochfahren soll, wenn sie auf 19Hz läuft
createState('javascript.0.VIS.cutpeltoff', 24, {name: 'cut p electric toff'});      //Temperatur, die als neue Vorlauftemperatur eingestellt werden soll, nachdem der Kompresso gestoppt ist
createState('javascript.0.VIS.cop', 0, {name: 'cop berechnen'});                    //hier wird der COP angezeigt (kein Slider sondern eine Zahl anzeigen in der VIS)
createState('javascript.0.VIS.dhwcop', 0, {name: 'dhwcop berechnen'});              //s.o. jedoch für Warmwasser
createState('javascript.0.VIS.output', "x", {name: 'x'});                           //eine Textausgabe, die z.b. den Verbrauch in Kwh seit 0 Uhr anzeigt, geht nur mit S0 Zähler am Heishamon

createState('javascript.0.VIS.WP_T_SWV' , 0, {name: ''});                           //Sollwertverschiebung der Heizkurve
createState('javascript.0.VIS.WP_T_VL_10' , 32, {name: ''});                        //Heizkurve für AT > 10
createState('javascript.0.VIS.WP_T_VL_5'  , 34, {name: ''});                        //Heizkurve für AT > 5
createState('javascript.0.VIS.WP_T_VL_0'  , 36, {name: ''});                        //Heizkurve für AT > 0
createState('javascript.0.VIS.WP_T_VL_M5' , 38, {name: ''});                        //Heizkurve für AT > -5
createState('javascript.0.VIS.WP_T_VL_M10', 40, {name: ''});                        //Heizkurve für AT > -10
createState('javascript.0.VIS.WP_T_VL_M15', 42, {name: ''});                        //Heizkurve für AT > -15

//createState('mqtt.0.panasonic_heat_pump.commands.SetDHWHeatDelta', 3, {name: ''});
//zum besseren Verständnis des Sourcetextes unten bei f_statemachine() weiterlesen, hier oben sind erstmal die unterroutinen programmiert.

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
let state_old = "state_komp_running";
let state_change = 0;
let waitseconds = 0;
let waitseconds2 = 0;
let s_outputold = "";
let writes = 0;

//######################################################
//######################################################
//##### set volrauf soll ###############################
/**
* @param {number} T_temp1lokal
* @param {number} T_minlokal
* @param {number} T_maxlokal
*/
function f_setvl( T_temp1lokal, T_minlokal, T_maxlokal )
{
    let go_further = 1;
    T_temp1lokal = Math.trunc(T_temp1lokal);

    if ( T_temp1lokal < T_minlokal)
    {
        T_temp1lokal = T_minlokal;
    }
	if ( T_temp1lokal > T_maxlokal)
	{
		T_temp1lokal = T_maxlokal;
	}
    //console.log("z1 " +Z1HeatRequestTemperature + " T_temp1lokal " + T_temp1lokal + " writes" + writes);
    if (T_temp1lokal != Z1HeatRequestTemperature)
    {
        //ungleich old und kleiner T_maxlokal
        if (Z1HeatRequestTemperature < T_temp1lokal)
        {
            console.log("up");
            waitseconds = 2*60;
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
                setState(SetZ1HeatRequestTemperature_MQTT, T_temp1lokal.toString());
                writes = writes + 1;
            }
        }
    }
}

//######################################################
//######################################################
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

//######################################################
//######################################################
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
//######################################################
//######################################################
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
//######################################################
//######################################################
/**
* @param {number} Z1HeatRequestTemperature_new_lokal
* @param {number} freq_lokal
* @param {number} T_inlet_lokal
* @param {number} T_outlet_lokal
*/
function f_new_vl_soll(Z1HeatRequestTemperature_new_lokal, freq_lokal, T_inlet_lokal, T_outlet_lokal)
{
    if (freq_lokal <= 20)
    {
        Z1HeatRequestTemperature_new_lokal = T_inlet_lokal + dT;
        Z1HeatRequestTemperature_new_lokal = f_bigger(Z1HeatRequestTemperature_new_lokal, T_outlet_lokal - 1);
        // outlet outlet-1 trunc diff 
        // 30     29       29    1        ok
        // 30,25  29,25    29    1,25     ok
        // 30,5   29,5     29    1,5      nok
        // 30,75  29,75    29    1,75     nok
        Z1HeatRequestTemperature_new_lokal = Math.trunc(Z1HeatRequestTemperature_new_lokal);
        if (T_outlet_lokal - Z1HeatRequestTemperature_new_lokal >= 1.5)
        {
            Z1HeatRequestTemperature_new_lokal = Z1HeatRequestTemperature_new_lokal + 1;            //wieder einen erhöhen
        }
    }
    else if (freq_lokal <= 50)
    {
        Z1HeatRequestTemperature_new_lokal = T_inlet_lokal + dT - 1;                                          //wir haben noch nicht total begrenzt können dT etwas reduzieren
        Z1HeatRequestTemperature_new_lokal = f_bigger(Z1HeatRequestTemperature_new_lokal, T_outlet_lokal - 1);
    }
    else
    {
        Z1HeatRequestTemperature_new_lokal = T_inlet_lokal + dT - 1;                                          //wir haben noch nicht total begrenzt können dT etwas reduzieren
        Z1HeatRequestTemperature_new_lokal = f_bigger(Z1HeatRequestTemperature_new_lokal, T_outlet_lokal - 1);
        //Z1HeatRequestTemperature_new_lokal = f_smaller(T_heizkurve, Z1HeatRequestTemperature_new_lokal);
    }
	return Z1HeatRequestTemperature_new_lokal;
}
//######################################################
//######################################################
//######################################################
//######################################################
//##### statemachine ###################################
function f_statemachine()
{
    //console.log("------------------------------");
    Z1HeatRequestTemperature = getState(SetZ1HeatRequestTemperature_MQTT).val;
    let IS_Compressor_Freq = getState(Compressor_Freq_MQTT).val;
    let IS_Main_Outlet_Temp = getState(Main_Outlet_Temp_MQTT).val;
    let IS_Main_Inlet_Temp = getState(Main_Inlet_Temp_MQTT).val;
    let ThreeWay_Valve_State = getState(ThreeWay_Valve_State_MQTT).val;
    //let Watt1 = getState(Watt1_MQTT).val;
    //let Heat_Power_Production = getState(Heat_Power_Production_MQTT).val;
    //let DHW_Power_Production = getState(DHW_Power_Production_MQTT).val;
    let Defrosting_State = getState(Defrosting_State_MQTT).val;
    let Operating_Mode_State = getState(Operating_Mode_State_MQTT).val;
    let Z1HeatRequestTemperature_new = 0;
    Z1HeatRequestTemperature_new = Z1HeatRequestTemperature;
    cutpel = getState('javascript.0.VIS.cutpel').val;   //über VIS = 0 keine Leistungsbegrenzung =1 Leistungsbegrenzung
    T_Max = getState('javascript.0.VIS.cutpeltmax').val;   //über VIS maximale Temperatur bis wohin er moduliert
    T_Off = getState('javascript.0.VIS.cutpeltoff').val;   //über VIS Temperatur die am Ende des Zyklusses eingestellt wird
    let T_AT = getState(AT_MQTT).val;

    if (state != state_old)
    {
        state_old = state;
        state_change = 1;
    }
    else
    {
        state_change = 0;
    }


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
                if (ThreeWay_Valve_State == 1) {state = "state_ww";}
                else {state = "state_komp_running";}
			}
        break;
        //#####################################################
        case "state_off":
            if (IS_Compressor_Freq != 0) 
			{
                if (ThreeWay_Valve_State == 1) {state = "state_ww";}
                else {state = "state_komp_running";}
			}
        break;
        //#####################################################
        case "state_ww":
            if (state_change == 1)
            {
                f_setvlforce(60);
            }

            if (ThreeWay_Valve_State == 0) 
            { 
                waitseconds2 = 40*60;
                state = "state_after_ww";
            }
        break;
        //#####################################################
        case "state_after_ww":
            Z1HeatRequestTemperature_new = f_new_vl_soll(Z1HeatRequestTemperature_new, IS_Compressor_Freq, IS_Main_Inlet_Temp, IS_Main_Outlet_Temp)
            if (Operating_Mode_State == 3)
            { 
            
            }
            else
            {
                //f_setvl(Z1HeatRequestTemperature_new, T_heizkurve, 58);
                f_setvlforce(Z1HeatRequestTemperature_new);
            }
            
            if ((waitseconds2 == 0) || (IS_Compressor_Freq == 0) || (T_heizkurve > Z1HeatRequestTemperature_new))
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
                Z1HeatRequestTemperature_new = f_new_vl_soll(Z1HeatRequestTemperature_new, IS_Compressor_Freq, IS_Main_Inlet_Temp, IS_Main_Outlet_Temp)
                f_setvl(Z1HeatRequestTemperature_new, T_heizkurve, T_Max);
            }
        break;
        //#####################################################
    }
        
    waitseconds -= (Timer_MS/1000);
    if (waitseconds <= 0) { 
        waitseconds = 0;
    }

    waitseconds2 -= (Timer_MS/1000);
    if (waitseconds2 <= 0) { 
        waitseconds2 = 0;
    }
    
    let s_output=""
    s_output += "HK="+ T_heizkurve;
    s_output += " Freq="+IS_Compressor_Freq +" IS_Inlet_T="+IS_Main_Inlet_Temp +" IS_Outlet_T="+IS_Main_Outlet_Temp +" 3="+ ThreeWay_Valve_State +" wait="+waitseconds;
    s_output += " dT=" + (IS_Main_Outlet_Temp - IS_Main_Inlet_Temp) + " abst=" + (Z1HeatRequestTemperature_new - IS_Main_Outlet_Temp)+" state="+state +" VL_new="+Z1HeatRequestTemperature_new;
    s_output += " VL="+Z1HeatRequestTemperature + " cutpel=" + cutpel + " writes=" + writes;
    if (s_outputold != s_output)
    {
        s_outputold = s_output;
        console.log(s_output);
        //console.log("Watt1=" + Watt1 + " COP=" + (Heat_Energy_Production/Watt1).toFixed(2) + " cutpel=" + cutpel);
        //if (Watt1 != 0)
        {
            //setState('javascript.0.VIS.cop', (Heat_Power_Production/Watt1).toFixed(2));
            //setState('javascript.0.VIS.dhwcop', (DHW_Power_Production/Watt1).toFixed(2));
        }
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
