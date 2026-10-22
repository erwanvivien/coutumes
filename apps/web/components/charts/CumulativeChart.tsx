'use client';

import { Delta } from '@/components/report/Delta';
import { formatCompact, formatEuro, formatSignedEuro } from '@/lib/report/format';
import { daysInMonth, monthName } from '@/lib/report/months';
import type { MonthReport } from '@/lib/report/types';
import { useState } from 'react';
import styles from './charts.module.css';
import { linear, niceTicks } from './scale';
import { Legend, Tooltip, TooltipRow } from './Tooltip';
import { useWidth } from './useWidth';

const HEIGHT = 260;
const MARGIN = { top: 16, right: 84, bottom: 28, left: 52 };

type Point = { day: number; revenue?: number; objective: number };

/** Running total of réalisé vs. running total of objectif — "are we on track for the month?" */
const cumulate = (report: MonthReport): Point[] => {
  const dayCount = daysInMonth(report.month);
  const byDay = new Map(report.days.map((day) => [day.day, day]));
  const lastFilled = Math.max(
    0,
    ...report.days.filter((d) => d.revenue !== undefined).map((d) => d.day),
  );

  // Without daily objectives, spread the monthly one evenly
  const hasDailyObjectives = report.days.some((day) => day.objective !== undefined);
  const evenObjective = (report.monthlyObjective ?? 0) / dayCount;

  let revenue = 0;
  let objective = 0;
  return Array.from({ length: dayCount }, (_, i) => {
    const day = byDay.get(i + 1);
    revenue += day?.revenue ?? 0;
    objective += hasDailyObjectives ? (day?.objective ?? 0) : evenObjective;
    return { day: i + 1, revenue: i + 1 <= lastFilled ? revenue : undefined, objective };
  });
};

const linePath = (points: { x: number; y: number }[]): string =>
  points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

export const CumulativeChart: React.FC<{ report: MonthReport }> = ({ report }) => {
  const [ref, width] = useWidth<HTMLDivElement>(960);
  const [hovered, setHovered] = useState<number | undefined>(undefined);

  const points = cumulate(report);
  const dayCount = points.length;
  const filled = points.filter((p): p is Required<Point> => p.revenue !== undefined);
  const max = Math.max(...points.map((p) => Math.max(p.objective, p.revenue ?? 0)));
  const ticks = niceTicks(max);

  const baseline = HEIGHT - MARGIN.bottom;
  const x = linear([1, dayCount], [MARGIN.left, width - MARGIN.right]);
  const y = linear([0, ticks[ticks.length - 1]], [baseline, MARGIN.top]);

  const objectiveLine = points.map((p) => ({ x: x(p.day), y: y(p.objective) }));
  const revenueLine = filled.map((p) => ({ x: x(p.day), y: y(p.revenue) }));
  const lastRevenue = filled.at(-1);
  const lastObjective = points[points.length - 1];

  const onPointerMove = (event: React.PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / bounds.width;
    setHovered(Math.min(dayCount, Math.max(1, Math.round(1 + ratio * (dayCount - 1)))));
  };

  const hoveredPoint = hovered === undefined ? undefined : points[hovered - 1];

  // End labels sit right of the plot; push them apart if they'd overlap
  const endLabels = [
    lastRevenue && {
      key: 'revenue',
      y: y(lastRevenue.revenue),
      x: x(lastRevenue.day),
      text: formatEuro(lastRevenue.revenue),
    },
    {
      key: 'objective',
      y: y(lastObjective.objective),
      x: x(lastObjective.day),
      text: formatEuro(lastObjective.objective),
    },
  ].filter((label): label is { key: string; y: number; x: number; text: string } => Boolean(label));
  if (endLabels.length === 2 && Math.abs(endLabels[0].y - endLabels[1].y) < 16) {
    const [upper, lower] =
      endLabels[0].y <= endLabels[1].y ? endLabels : [endLabels[1], endLabels[0]];
    const mid = (upper.y + lower.y) / 2;
    upper.y = mid - 8;
    lower.y = mid + 8;
  }

  return (
    <figure className={styles.figure}>
      <Legend
        items={[
          { label: 'Réalisé cumulé', series: 'revenue', shape: 'line' },
          { label: 'Objectif cumulé', series: 'objective', shape: 'line' },
        ]}
      />
      <div ref={ref} className={styles.plot}>
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className={styles.svg}
          role="img"
          aria-label={`Chiffre d’affaires cumulé et objectif cumulé, ${monthName(report.month)}`}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? styles.baseline : styles.grid}
              />
              <text x={MARGIN.left - 8} y={y(tick)} className={styles.yTick}>
                {tick === 0 ? '0' : `${formatCompact(tick)} €`}
              </text>
            </g>
          ))}
          {[1, 8, 15, 22, dayCount].map((day) => (
            <text key={day} x={x(day)} y={baseline + 18} className={styles.xTick}>
              {day}
            </text>
          ))}

          {revenueLine.length > 0 && (
            <path
              d={`${linePath(revenueLine)} L${revenueLine[revenueLine.length - 1].x},${baseline} L${revenueLine[0].x},${baseline} Z`}
              className={styles.area}
            />
          )}
          <path d={linePath(objectiveLine)} className={styles.lineObjective} />
          {revenueLine.length > 0 && (
            <path d={linePath(revenueLine)} className={styles.lineRevenue} />
          )}

          {hoveredPoint !== undefined && (
            <line
              x1={x(hoveredPoint.day)}
              x2={x(hoveredPoint.day)}
              y1={MARGIN.top}
              y2={baseline}
              className={styles.crosshair}
            />
          )}
          {hoveredPoint !== undefined && (
            <circle
              cx={x(hoveredPoint.day)}
              cy={y(hoveredPoint.objective)}
              r={4}
              className={styles.dotObjective}
            />
          )}
          {lastRevenue !== undefined && hoveredPoint === undefined && (
            <circle
              cx={x(lastRevenue.day)}
              cy={y(lastRevenue.revenue)}
              r={4}
              className={styles.dotRevenue}
            />
          )}
          {hoveredPoint?.revenue !== undefined && (
            <circle
              cx={x(hoveredPoint.day)}
              cy={y(hoveredPoint.revenue)}
              r={4}
              className={styles.dotRevenue}
            />
          )}

          {endLabels.map((label) => (
            <text
              key={label.key}
              x={width - MARGIN.right + 8}
              y={label.y}
              className={styles.endLabel}
            >
              {label.text}
            </text>
          ))}

          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={width - MARGIN.left - MARGIN.right}
            height={baseline - MARGIN.top}
            className={styles.hit}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHovered(undefined)}
          />
        </svg>

        {hoveredPoint !== undefined && (
          <Tooltip
            x={x(hoveredPoint.day)}
            width={width}
            title={`Au ${hoveredPoint.day} ${monthName(report.month).toLowerCase()}`}
          >
            <TooltipRow
              swatch="revenue"
              label="Réalisé cumulé"
              value={formatEuro(hoveredPoint.revenue)}
            />
            <TooltipRow
              swatch="objective"
              label="Objectif cumulé"
              value={formatEuro(hoveredPoint.objective)}
            />
            {hoveredPoint.revenue !== undefined && (
              <TooltipRow
                label="Écart"
                value={
                  <Delta
                    value={hoveredPoint.revenue - hoveredPoint.objective}
                    format={formatSignedEuro}
                  />
                }
              />
            )}
          </Tooltip>
        )}
      </div>
    </figure>
  );
};
