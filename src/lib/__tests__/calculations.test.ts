import { calculateSessionValue, getPeriodForDate } from '../calculations';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('--- Iniciando Testes Unitários de Cálculos ---');

// 1. Testes de valores
assert(calculateSessionValue('psicologa', 45) === 30, 'Psicóloga 45m deve ser 30');
assert(calculateSessionValue('at', 60) === 25, 'AT 60m deve ser 25');
assert(calculateSessionValue('at', 90) === 37.5, 'AT 90m deve ser 37.5');
assert(calculateSessionValue('at', 120) === 50, 'AT 120m deve ser 50');
assert(calculateSessionValue('at', 135) === 56.25, 'AT 135m deve ser 56.25');

console.log('✓ Todos os testes de cálculo de valor passaram!');

// 2. Testes de períodos (Corte dia 26)
const p1 = getPeriodForDate('2026-08-28', 26);
assert(p1.startDate === '2026-08-26', `Início esperado 2026-08-26, recebido ${p1.startDate}`);
assert(p1.endDate === '2026-09-25', `Fim esperado 2026-09-25, recebido ${p1.endDate}`);

const p2 = getPeriodForDate('2026-09-20', 26);
assert(p2.startDate === '2026-08-26', `Início esperado 2026-08-26, recebido ${p2.startDate}`);
assert(p2.endDate === '2026-09-25', `Fim esperado 2026-09-25, recebido ${p2.endDate}`);

const p3 = getPeriodForDate('2026-09-25', 26);
assert(p3.startDate === '2026-08-26', `Início esperado 2026-08-26, recebido ${p3.startDate}`);
assert(p3.endDate === '2026-09-25', `Fim esperado 2026-09-25, recebido ${p3.endDate}`);

const p4 = getPeriodForDate('2026-09-26', 26);
assert(p4.startDate === '2026-09-26', `Início esperado 2026-09-26, recebido ${p4.startDate}`);
assert(p4.endDate === '2026-10-25', `Fim esperado 2026-10-25, recebido ${p4.endDate}`);

// Virada de ano: Dezembro para Janeiro
const p5 = getPeriodForDate('2026-12-28', 26);
assert(p5.startDate === '2026-12-26', `Início esperado 2026-12-26, recebido ${p5.startDate}`);
assert(p5.endDate === '2027-01-25', `Fim esperado 2027-01-25, recebido ${p5.endDate}`);

console.log('✓ Todos os testes de períodos de pagamento passaram com 100% de sucesso!');
