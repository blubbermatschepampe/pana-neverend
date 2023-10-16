# pana-neverend

Dieses Skript läuft auf IO-Broker mit eine Pana-WP.

Es ist in der ersten Ausbaustufe dazu gedacht die WP auf minimaler Leistung zu halten und deswegen geht er langsam mit der VL-Soll hoch bis zu VL_Max = 42.

Damit kriegt man unendlich Takte hin.
Man kann auch Begrenzung = 0 machen, dann kann man auch höhere Leistungen (VL-Soll einstellen).

Im wesendlichen besteht die Statemachine aus 2 States:

komp1 => die ersten 30 Minuten versucht er nicht Frequenzen < 23 Hz zu erreichen, sondern sorgt dafür, das die WP nicht aus geht.

komp2 => nach den ersten 30 Minuten versucht er die VL-Soll immer weiter zu senken (nur bei Begrenzung = 1), damit die Frequenz (Leistung) minimal wird.
Das sind so ca 19-21 Hz.

Zukunft:

Die WP soll komplett Leistungsgesteuert sein.


Wenn man einen Slider mit dem Datenpunkt javascript.0.VIS.cutpel verbindet, kann man über 0 und 1 die Begrenzung der Leistung ein und ausstellen.
Er verringert dann die Soll-VL nicht mehr so weit, dass die WP runterregelt
Er erhöht dann aber noch die Soll-VL, so dass die WP nicht ausgeht.
