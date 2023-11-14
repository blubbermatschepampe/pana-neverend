# pana-neverend

Dieses Skript läuft auf IO-Broker + Heishamon mit einer Pana-J-WP.
=====
Also im Grunde ist das Skript eine Abwandlung von der Moehrchentaktik. Die allerdings nutzt die Sollwertverschiebung und den Flüstermodus, so weit ich mich erinnere.



Mein Skript läuft bei mir auf HK im Altbau auf der Jeisha 09.

Meine Pumpenrate ist auf maximal 15 l/min und mein dT auf 3. SollVL aktuell auf 32 Grad @AT5 Grad.

(dT sollte deshalb gleich eingestellt sein wie bei der WP.)

Die WP läuft für das Skript mit Festwert, der Vorteil ist das man gegenüber der SWV dann mehr Bonusgrade geben kann.

In Tmax=46 stellt man so die maximale VL-Temperatur ein. Tmax ist bei mir so eingestellt, die erreicht er eigentlich nie. d.h. er macht einen unendlich langen Takt. Sollte er es doch erreichen würde der Kompressor abgeschaltet und Toff wird eingestellt. Je geringer Toff desto länger wäre dann die Taktpause. Je größer Tmax, desto länger der Einschalttakt. Tmin=23 würde bei mir bedeuten, dass er auf sich auf minimale VL-Soll einstellt und damit auf minimale Leistung. Das sind so 400-600Watt oder 19-22Hz. Da das nun zu wenig ist bei den AT kann man über Tmin etwas mehr einstellen, was dann die minimale VL-Temp angibt. Er fährt also die Leistung so weit runter, bis er eigentlich Tmin als SollVL erreicht und bleibt da. Tmin ist also quasi als erster Punkt der Heizkurve zu verstehen. Später, wenn es kälter wird werde ich noch eine Gerade oder mehr Punkte einbauen. Aktuell ist es so >10Grad AT kann ich Tmin auf z.b. 20 stellen und mit minimaler Leistung einen sehr langen Takt fahren (z.b. 30 Grad VL bei mir). Oder bei AT<10 Grad stelle ich auf Tmin=32 Grad, damit der Soll-VL nie unter 32 fällt.



Einzustellende Inputs also Tmin (Slider), Tmax(Slider), dT(im Skript)

Outputs ist Z1HeatRequestTemperature



Es sind noch einige andere Variablen drin, die aber nicht mehr gebraucht werden.

Über das Log kann man sehen was er gerade macht.

Über die

javascript.0.VIS.cop gibt er den Cop aus, Strom würde er über S0 messen, braucht man aber nicht

javascript.0.VIS.output sieht man sowas ähnliches wie im Log kann man in der Vis anzeigen, braucht man auch nicht.



Funktion: Es gibt States, läuft er im Heizbetrieb greift er in die Regelung ein.

Die versucht eigentlich nur immer den Soll-VL 1 Grad unter Ist-VL zu halten und dT einzuhalten.

Das führt dann dazu, dass beim Einschalten der WP diese erstmal relativ viel Gas gibt aber genug Luft bekommt damit sie mit Sicherheit nicht ausgeht. Nach einiger Zeit steigt der VL nicht mehr und er versucht den Soll-VL immer runterzudrücken. Dabei soll die WP an bleiben und reduziert logischer weise die Leistung immer weiter. Damit die Leistung nicht zu gering wird, kann man Tmin vorgeben.

Analog dazu kann man Tmax vorgeben. Ist es draußen beispielsweise 18 Grad könnte es schon sein, dass die WP ihre Leistung die ja minimal ca. 2600 Watt thermisch beträgt nicht los wird und der Soll-VL immer weiter hoch geht. Dabei bleibt sie aber nach dem Anlaufen wo sie wohl mehr Gas gibt, vielleicht für die Schmierung oder auch um Soll schnell zu erreichen auf minimaler Leistung. Frisst also kein Brot, weil in der Zeit eh genug PV da ist.....



Naja so die Überlegung und meine Anwendung.
