# pana-neverend

Dieses Skript läuft auf IO-Broker mit eine Pana-WP.

Es ist in der ersten Ausbaustufe dazu gedacht die WP auf minimaler Leistung zu halten und deswegen geht er langsam mit der VL-Soll hoch bis zu VL_Max = 42.

Damit kriegt man unendlich Takte hin.
Man kann auch Begrenzung = 0 machen, dann kann man auch höhere Leistungen (VL-Soll einstellen).

Im wesendlichen besteht die Statemachine aus 2 States:

komp1 => die ersten 30 Minuten versucht er nicht Frequenzen < 23 Hz zu erreichen, sondern sorgt dafür, das die WP nicht aus geht.

komp2 => nach den ersten 30 Minuten versucht er die VL-Soll immer weiter zu senken, damit die Frequenz (Leistung) minimal wird.
Das sind so ca 19-21 Hz.

Zukunft:

Die WP soll komplett Leistungsgesteuert sein.
