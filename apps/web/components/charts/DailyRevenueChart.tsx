'use client';

import { Delta } from '@/components/report/Delta';
import {
  formatCompact,
  formatEuro,
  formatEuroCents,
  formatInteger,
  formatSignedEuro,
} from '@/lib/report/format';
import { daysInMonth, monthName, weekdayIndex, weekdayName } from '@/lib/report/months';
import type { MonthReport } from '@/lib/report/types';
import { useState } from 'react';
import styles from './charts.module.css';
import { columnPath, linear, niceTicks } from './scale';
import { Legend, Tooltip, TooltipRow } from './Tooltip';
import { useWidth } from './useWidth';

const HEIGHT = 280;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 52 };

/** Réalisé per day as columns, with the day's objective as a target tick across each slot. */
export const DailyRevenueChart: React.FC<{ report: MonthReport }> = ({ report }) => {
  const [ref, width] = useWidth<HTMLDivElement>(960);
  const [hovered, setHovered] = useState<number | undefined>(undefined);

  const dayCount = daysInMonth(report.month);
  const byDay = new Map(report.days.map((day) => [day.day, day]));
  const max = Math.max(0, ...report.days.flatMap((day) => [day.revenue ?? 0, day.objective ?? 0]));
  const ticks = niceTicks(max);

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const band = plotWidth / dayCount;
  const barWidth = Math.max(2, Math.min(24, band - 4));
  const baseline = HEIGHT - MARGIN.bottom;
  const y = linear([0, ticks[ticks.length - 1]], [baseline, MARGIN.top]);
  const bandX = (day: number) => MARGIN.left + (day - 1) * band;
  const labelEvery = band >= 22 ? 1 : 0;

  const hoveredDay = hovered === undefined ? undefined : byDay.get(hovered);

  return (
    <figure className={styles.figure}>
      <Legend
        items={[
          { label: 'Réalisé', series: 'revenue', shape: 'rect' },
          { label: 'Objectif', series: 'objective', shape: 'line' },
        ]}
      />
      <div ref={ref} className={styles.plot} onPointerLeave={() => setHovered(undefined)}>
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className={styles.svg}
          role="img"
          aria-label={`Chiffre d’affaires réalisé et objectif par jour, ${monthName(report.month)}`}
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

          {Array.from({ length: dayCount }, (_, i) => i + 1).map((dayNumber) => {
            const day = byDay.get(dayNumber);
            const x = bandX(dayNumber);
            const center = x + band / 2;
            const isMonday = weekdayIndex(report.month, dayNumber) === 0;
            const showLabel = labelEvery === 1 || isMonday || dayNumber === 1;

            return (
              <g key={dayNumber} className={hovered === dayNumber ? styles.hovered : undefined}>
                {hovered === dayNumber && (
                  <rect
                    x={x}
                    y={MARGIN.top}
                    width={band}
                    height={baseline - MARGIN.top}
                    className={styles.hoverBand}
                  />
                )}
                {day?.revenue !== undefined && (
                  <path
                    d={columnPath(center - barWidth / 2, y(day.revenue), barWidth, baseline)}
                    className={styles.column}
                  />
                )}
                {day?.objective !== undefined && (
                  <line
                    x1={center - Math.min(band / 2 - 1, barWidth / 2 + 4)}
                    x2={center + Math.min(band / 2 - 1, barWidth / 2 + 4)}
                    y1={y(day.objective)}
                    y2={y(day.objective)}
                    className={styles.targetTick}
                  />
                )}
                {showLabel && (
                  <text x={center} y={baseline + 18} className={styles.xTick}>
                    {dayNumber}
                  </text>
                )}
                {/* Hit target: the whole day slot, not just the painted column */}
                <rect
                  x={x}
                  y={MARGIN.top}
                  width={band}
                  height={baseline - MARGIN.top}
                  className={styles.hit}
                  tabIndex={day === undefined ? undefined : 0}
                  aria-label={`${dayNumber} : ${formatEuro(day?.revenue)}`}
                  onPointerEnter={() => setHovered(dayNumber)}
                  onFocus={() => setHovered(dayNumber)}
                  onBlur={() => setHovered(undefined)}
                />
              </g>
            );
          })}
        </svg>

        {hovered !== undefined && (
          <Tooltip
            x={bandX(hovered) + band / 2}
            width={width}
            title={`${weekdayName(report.month, hovered)} ${hovered} ${monthName(report.month).toLowerCase()}`}
          >
            {hoveredDay === undefined ||
            (hoveredDay.revenue === undefined && hoveredDay.objective === undefined) ? (
              <p className={styles.tooltipLabel}>Pas de données</p>
            ) : (
              <>
                <TooltipRow
                  swatch="revenue"
                  label="Réalisé"
                  value={formatEuro(hoveredDay.revenue)}
                />
                <TooltipRow
                  swatch="objective"
                  label="Objectif"
                  value={formatEuro(hoveredDay.objective)}
                />
                {hoveredDay.revenue !== undefined && (
                  <>
                    <TooltipRow
                      label="Écart"
                      value={
                        <Delta
                          value={hoveredDay.revenue - (hoveredDay.objective ?? 0)}
                          format={formatSignedEuro}
                        />
                      }
                    />
                    <TooltipRow label="Tickets" value={formatInteger(hoveredDay.tickets)} />
                    <TooltipRow
                      label="Panier moyen"
                      value={formatEuroCents(
                        hoveredDay.tickets ? hoveredDay.revenue / hoveredDay.tickets : undefined,
                      )}
                    />
                  </>
                )}
              </>
            )}
          </Tooltip>
        )}
      </div>
    </figure>
  );
};
