# reglas zonas

- Tratamos de que en la zona sea de 3 para que clasifiquen 2.
- Si la suma de parejas da division de 3, todas las zonas tiene 3 parejas
- La idea siempre es tratar de que clasifiquen dos parejas por zona.
- **Sobra 1 pareja:**  se debe conformar una zona de 4 parejas, que obligatoriamente será la Zona A
- **Sobran 2:** Se deben confeccionar dos zonas de 4 parejas, que serán la Zona A y la Zona B.
- **Total de 5 parejas:** Se organiza una zona de 2 y una zona de 3. La zona de 2 la integran el #1 y #2 del ranking.
- **Total de 4 parejas**: Se puede organizar como zona única de todos contra todos o eliminación directa desde semifinales.
- lo ideal seria que todos jueguen octavos de final, pero en el caso por ejemplo, que se incriben 25 parejas, en ese caso, dos parejas deberian enfrentarse en 16 avos, en caso de tener un torneo chico de 12 parejas, los 2 clasificados de cada zona pasarian a 8vos de final.

## **El Sistema de Puntuación y el Algoritmo de Desempate**

Para que un agente de software pueda determinar automáticamente las posiciones de una zona, debe aplicar la tabla de puntos estandarizada por la fiscalización argentina. Esta puntuación no solo refleja el éxito deportivo, sino que penaliza la falta de compromiso con el torneo, como ocurre en los casos de incomparecencia o abandono.

### **Tabla de Puntuación por Partido**

El sistema debe asignar puntos inmediatamente después de la carga del resultado del partido. La jerarquía de puntos es la siguiente :

- **Partido Ganado:** 2 puntos.
- **Partido Jugado y Perdido:** 1 punto.
- **Partido Perdido por W.O. (Walk-Over):** 0 puntos.

La distinción entre perder jugando y perder por no presentación es crucial. Una pareja que pierde sus dos partidos en cancha suma 2 puntos, lo que la sitúa por encima de una pareja que ganó un partido pero no se presentó al segundo, perdiendo por W.O. y quedando con 2 puntos pero con una sanción disciplinaria implícita.

### **Resolución de Conflictos de Igualdad (Empates)**

El punto más complejo de la lógica de programación es el desempate. Cuando dos o más parejas igualan en puntos al finalizar la zona, el sistema debe recorrer un árbol de decisiones jerarquizado para establecer el orden final.

### **Empate entre Dos Parejas**

Si la igualdad se produce entre dos equipos, la regla universal es el **Resultado en Cancha**. El ganador del enfrentamiento directo entre ambos clasifica automáticamente por encima del perdedor, sin importar cuántos sets o games hayan ganado en otros partidos de la misma zona.

### **El Escenario del Triple Empate**

Si tres parejas empatan en puntos (por ejemplo, A vence a B, B vence a C, y C vence a A), el resultado directo entra en un bucle circular y se vuelve inútil para desempatar. En este caso, el sistema debe recurrir a la estadística acumulada en el siguiente orden estricto :

1. **Diferencia de Sets:** Se restan los sets en contra de los sets a favor obtenidos en todos los partidos de la zona.
2. **Diferencia de Games:** Si persiste la igualdad en sets, se realiza el mismo cálculo con los games (Favor - Contra).
3. **Mayor Cantidad de Games a Favor:** Se beneficia a la pareja con un juego más ofensivo o con mayor volumen de games ganados.
4. **Sorteo:** Si la igualdad matemática es absoluta tras los tres criterios anteriores, la organización realiza un sorteo fiscalizado para determinar la posición.

Es fundamental que el desarrollador del sistema comprenda que, si al aplicar un criterio (como la diferencia de sets) una de las tres parejas queda definida en una posición (ya sea primera o tercera), las otras dos parejas restantes deben volver a desempatar entre sí utilizando nuevamente el **Resultado en Cancha** antes de pasar al siguiente criterio estadístico. Este "reinicio" del desempate entre dos es una regla de oro en el pádel federado que evita injusticias matemáticas

**Arquitectura de la Fase de Eliminación Directa (Llaves)**
Una vez resueltas las zonas, el torneo entra en su fase de mayor tensión: los playoffs o llaves. El paso de una estructura de grupos a una de eliminación simple requiere un algoritmo de jerarquización que premie a los mejores clasificados y evite que parejas de la misma zona se crucen en las primeras rondas de la llave.
****

**Jerarquización de Clasificados (El Ranking Interno)**
No todos los primeros puestos son iguales, ni todos los segundos. Para armar un cuadro equilibrado, el sistema debe crear una "Tabla General de Posiciones" comparando el rendimiento de los clasificados de todas las zonas.**Criterio de OrdenamientoProceso Algorítmico**Primero: Los 1° de ZonaSe ordenan todos los equipos que terminaron en primer lugar según: puntos, sets, games y games a favor.Segundo: Los 2° de ZonaSe repite el proceso con todos los escoltas de zona, ubicándolos a continuación de los ganadores en el ranking interno.Tercero: Los 3° de ZonaSolo en casos excepcionales donde clasifiquen más de dos por zona (poco común en APA).
Esta jerarquización permite asignar los "sembrados" del cuadro final. En un torneo de 32 parejas con 8 zonas de 4 o zonas de 3 donde pasan dos por grupo, tendremos 16 clasificados.
****

**Armado del Cuadro y Prevención de Re-enfrentamientos**
La construcción de la llave debe seguir un patrón de distribución que garantice que el 1° de la Zona A no se encuentre con el 2° de la Zona A hasta una hipotética final. Esto se logra mediante la técnica de espejo o distribución cruzada. Los sembrados #1 y #2 del torneo (los dos mejores primeros de zona) se colocan en los extremos opuestos del cuadro (arriba del todo y abajo del todo) para que solo puedan cruzarse en la final.
En un cuadro típico de 16 parejas (Octavos de Final), la distribución lógica para un sistema sería :
• **Extremo Superior:** 1° de Zona A.
• **Enfrentamiento:** Contra un 2° de una zona distante (ej. 2° de Zona H).
• **Extremo Inferior:** 1° de Zona B.
• **Enfrentamiento:** Contra el 2° de la Zona A (para asegurar que los dos que ya jugaron entre sí en la zona estén lo más lejos posible en la llave).
**Gestión de Byes (Exentos)**
Cuando la cantidad de clasificados no completa una potencia de dos ($8, 16, 32$), el sistema debe introducir "Byes". Por ejemplo, si hay 12 clasificados, el cuadro base es de 16, lo que deja 4 espacios vacíos. Estos espacios deben asignarse obligatoriamente a los mejores sembrados (los mejores 1° de zona) para que avancen a la segunda ronda (Cuartos de Final) sin jugar la primera. Este beneficio deportivo es el incentivo principal para buscar el mejor coeficiente estadístico durante la fase de zonas.
****

**Aspectos Técnicos y Logísticos para el Agente Programable**
Para que un agente de IA pueda supervisar el cumplimiento de las reglas, debe integrar variables que van más allá del simple tanteo de games. El pádel amateur está sujeto a contingencias humanas y climáticas que deben estar contempladas en el código del sistema.
****

**El Formato de Partido y el Tiempo de Juego**
Un error común en los sistemas de gestión es no prever la duración real de los encuentros. La APA y la FAP dictan normas específicas para agilizar los torneos de fin de semana sin sacrificar la esencia del juego.
1. **Punto de Oro (Golden Point):** Se elimina la ventaja. En el 40-40, se juega un solo punto donde los receptores eligen el lado. Esto reduce la duración de los partidos en un promedio de 15 a 20 minutos.
2. **Super Tie-Break:** En fases clasificatorias, es habitual sustituir el tercer set por un tie-break a 10 o 11 puntos (Super Tie-Break) para evitar retrasos acumulativos en la programación del club.
3. **Intervalos de Descanso:** El sistema debe impedir que una pareja juegue su segundo partido antes de que pase al menos una hora de descanso tras finalizar el primero.
****

**Gestión de Suplentes y Reemplazos**
La política de suplentes es restrictiva en torneos oficiales para evitar el "choreo" o la manipulación de categorías por parte de jugadores de mayor nivel que ingresan a último momento. El sistema debe validar que:
• Los suplentes solo se permiten en fase de grupos por causas justificadas (lesión, viaje).
• El suplente debe ser de igual o menor categoría que el titular reemplazado.
• En la fase de Playoffs (llaves), los cambios suelen estar terminantemente prohibidos. Si una pareja inicia la llave con un suplente, debe terminar todo el cuadro con ese mismo jugador.
****

**Protocolo de Walk-Over y Descalificación**
El W.O. es la herramienta administrativa más potente de la organización. Un retraso superior a 15 minutos sin aviso justifica la pérdida del partido por 6-0 / 6-0. Sin embargo, el sistema debe diferenciar entre un W.O. administrativo y una descalificación por conducta antideportiva o "ser de categoría superior", lo cual conlleva la expulsión inmediata y la anulación de todos los puntos obtenidos en el torneo.
****