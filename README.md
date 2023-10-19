# pana-neverend

Dieses Skript läuft auf IO-Broker + Heishamon mit einer Pana-J-WP.
=====
Es ist in der ersten Ausbaustufe dazu gedacht die WP auf minimaler Leistung zu halten und deswegen geht er langsam mit der VL-Soll hoch bis zu VL_Max = 42.

Damit kriegt man unendlich Takte hin.
Man kann auch Begrenzung = 0 machen, dann kann man auch höhere Leistungen (VL-Soll einstellen).

Achso: Wenn ein Takt zu ende ist setzt er den Soll-VL auf 24 Grad, damit er erstmal aus bleibt.
Wird vermutlich irgendwann mal anders gemacht.

Wenn der Takt zu lang wird, also zu warm in der Bude muss man var T_Max = 42 runtersetzen.
Man sollte ihr aber Luft nach oben geben, also ruhig paar Grad mehr, sonst werden die Takte irgenwann doch ganz kurz.
Einfach mal die Soll-VL nach z.B. 2h angucken und das kann man dann als T_Max nehmen.

Im wesendlichen besteht die Statemachine aus 2 States:

komp1 => die ersten 30 Minuten versucht er nicht Frequenzen < 23 Hz zu erreichen, sondern sorgt dafür, das die WP nicht aus geht.

komp2 => nach den ersten 30 Minuten versucht er die VL-Soll immer weiter zu senken (nur bei Begrenzung = 1), damit die Frequenz (Leistung) minimal wird.
Das sind so ca 19-21 Hz.

Wenn man einen Slider mit dem Datenpunkt javascript.0.VIS.cutpel verbindet, kann man über 0 und 1 die Begrenzung der Leistung ein und ausstellen.
Er verringert dann die Soll-VL nicht mehr so weit, dass die WP runterregelt
Er erhöht dann aber noch die Soll-VL, so dass die WP nicht ausgeht.

Der Datenpunkt für den Stromzähler braucht man nicht, er ist nur zur COP Berechnung, man kann den ungenauen internen Wert nehmen, wenn man möchte
================================================================================
Zukunft:

Die WP soll komplett Leistungsgesteuert sein.

Heizkurve im Skript drin
