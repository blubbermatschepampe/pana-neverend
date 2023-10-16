const SetZ1HeatRequestTemperature_MQTT = 'mqtt.0.panasonic_heat_pump.commands.SetZ1HeatRequestTemperature';
const Compressor_Freq_MQTT = 'mqtt.0.panasonic_heat_pump.main.Compressor_Freq';
const ThreeWay_Valve_State_MQTT = 'mqtt.0.panasonic_heat_pump.main.ThreeWay_Valve_State';
const Main_Outlet_Temp_MQTT = 'mqtt.0.panasonic_heat_pump.main.Main_Outlet_Temp';
const Main_Inlet_Temp_MQTT = 'mqtt.0.panasonic_heat_pump.main.Main_Inlet_Temp';
const Watt1_MQTT = 'mqtt.0.panasonic_heat_pump.s0.Watt.1';
const Heat_Energy_Production_MQTT = 'mqtt.0.panasonic_heat_pump.main.Heat_Energy_Production';

//scalieren über marking im echarts
const Timer_MS = 10000;

//startup
createState('javascript.0.VIS.cutpel', 1, {name: 'cut p electric'});
createState('javascript.0.VIS.cop', 0, {name: 'cop berechnen'});
createState('javascript.0.VIS.output', "x", {name: 'x'});

setInterval(f_statemachine, Timer_MS)
var state = "state_komp_running";		//starten mit eingeschwungenem Zustand fuer Restarts
var waitseconds = 0;
var dT = 3;
var begrenzung = 1;                 
var T_Max = 42
var Z1HeatRequestTemperature_old = 0;
//wenn dies auf 1 steht versucht er die minimale Leistung anzufahren. Man kann es auf 0 (über VIS) setzen, dann kann man auch höher Leistungen fahren indem man SetZ1HeatRequestTemperature hochzieht
//bis zu T_Max versucht er dann mindestens die minimale Leistung zu halten.

//var state = "state_komp_start";		//starten mit eingeschwungenem Zustand =erste 30 Minuten fuer Restarts
//var wait1 = 850;
var s_outputold = "";

//##### set volrauf soll ###############################
function f_setvl( x )
{
    if ((x != Z1HeatRequestTemperature_old) && ( x < T_Max))
    {
        //ungleich old und kleiner T_Max
        if (Z1HeatRequestTemperature_old > x)
        {
            console.log("up");
            setState(SetZ1HeatRequestTemperature_MQTT, x);
            Z1HeatRequestTemperature_old = x;
        }
        else
        {
            if((begrenzung == 1))
            {
                console.log("down");
                setState(SetZ1HeatRequestTemperature_MQTT, x);
                Z1HeatRequestTemperature_old = x;
            }
        }
    }

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
    let Heat_Energy_Production= getState(Heat_Energy_Production_MQTT).val;
    let Z1HeatRequestTemperature_new = 0;
    Z1HeatRequestTemperature_new = Z1HeatRequestTemperature;
    begrenzung = getState('javascript.0.VIS.cutpel').val;   //über VIS = 0 keine Leistungsbegrenzung =1 Leistungsbegrenzung

	//#### for all #################################################
    if (ThreeWay_Valve_State == 1) {state = "state_ww";}

	//#####################################################
    switch (state) 
    {
        case "state_off":
            if (IS_Compressor_Freq != 0) {state = "state_ww";}
        break;
        //#####################################################
        case "state_ww":
            if (ThreeWay_Valve_State == 0) 
            { 
                state = "state_komp_start";
                waitseconds = 30*60;
            }
        break;
        //#####################################################
        case "state_komp_start":
            if (IS_Main_Outlet_Temp >= Z1HeatRequestTemperature_new + 1.5)
            {
                Z1HeatRequestTemperature_new = IS_Main_Outlet_Temp;
                f_setvl(Z1HeatRequestTemperature_new);
                console.log("hier75+");
            }
            if (Z1HeatRequestTemperature_new - IS_Main_Inlet_Temp <= dT + 1)
            {
                Z1HeatRequestTemperature_new = IS_Main_Inlet_Temp + dT + 1;
                f_setvl(Z1HeatRequestTemperature_new);
                console.log("hier81+");
            }
            if (IS_Compressor_Freq >= 26) {
                if (Z1HeatRequestTemperature_new > IS_Main_Outlet_Temp){
                    Z1HeatRequestTemperature_new = IS_Main_Outlet_Temp;
                    f_setvl(Z1HeatRequestTemperature_new);
                    console.log("hier87-");
                }
            }
            if (IS_Compressor_Freq == 0) {
                state = "state_off";
            }

            if (waitseconds <= 0)
            {
                state = "state_komp_running";
            }
        break;
        //#####################################################
        case "state_komp_running":
            if (IS_Compressor_Freq == 0) {
                Z1HeatRequestTemperature_new = 24;
                f_setvl(Z1HeatRequestTemperature_new);
                console.log("hier104-");
                state = "state_off";
            }
            else if (IS_Compressor_Freq <= 20)
            {
                if  (IS_Main_Outlet_Temp >= Z1HeatRequestTemperature_new + 1.5) 
                {
                    Z1HeatRequestTemperature_new = Z1HeatRequestTemperature_new + 1;
                    if (Z1HeatRequestTemperature_new < IS_Main_Outlet_Temp + 1.5) 
                    {
                        console.log("hier1148+");
                    }
                    f_setvl(Z1HeatRequestTemperature_new);
                        console.log("hier117+");
                }
                if (Z1HeatRequestTemperature_new - IS_Main_Inlet_Temp < dT) 
                {
                    //mindestens 4 Grad fuer DeltaT setzen
                    Z1HeatRequestTemperature_new = IS_Main_Inlet_Temp + dT;
                    console.log("hier123+");
                    f_setvl(Z1HeatRequestTemperature_new);
                }
            }
            else if (IS_Compressor_Freq >= 22)
            {
                //if((begrenzung == 1))
                {
                    if (IS_Main_Outlet_Temp - IS_Main_Inlet_Temp > dT ) 
                    {
                        //mindestens dT Grad fuer DeltaT setzen
                        Z1HeatRequestTemperature_new = IS_Main_Inlet_Temp + dT;

                        if (Z1HeatRequestTemperature_new < IS_Main_Outlet_Temp - 1) 
                        {
                            //höchstens 1 Grad unter IS_Outlet_T nicht tiefer
                            Z1HeatRequestTemperature_new = IS_Main_Outlet_Temp - 1;
                        }

                        //Z1HeatRequestTemperature -= 0.25;
                        if (waitseconds <= 0)
                        {
                            console.log("hier145-");
                            f_setvl(Z1HeatRequestTemperature_new);
                            waitseconds=10*60;
                        }
                    }
                }
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
    s_output += " VL="+Z1HeatRequestTemperature;
    if (s_outputold != s_output)
    {
        s_outputold = s_output;
        console.log(s_output);
        console.log("Watt1=" + Watt1 + " COP=" + (Heat_Energy_Production/Watt1).toFixed(2) + " begrenzung=" + begrenzung);
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
    begrenzung = obj.state.val;
});
