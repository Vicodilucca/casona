'use client';

import { useState } from 'react';
import type { Reserva } from '@/lib/types';
import PrintButton from './PrintButton';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtFecha(s: string): string {
  const [y, m, d] = s.split('-');
  return `${parseInt(d)} / ${parseInt(m)} / ${y}`;
}

function numeroALetras(n: number): string {
  if (n === 0) return 'cero';

  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
    'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  const decenas  = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const veintis  = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
    'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];

  const parts: string[] = [];
  let r = n;

  if (r >= 1000) {
    const m = Math.floor(r / 1000);
    parts.push(m === 1 ? 'mil' : `${numeroALetras(m)} mil`);
    r %= 1000;
  }

  if (r >= 100) {
    const c = Math.floor(r / 100);
    const rem = r % 100;
    parts.push(c === 1 && rem === 0 ? 'cien' : centenas[c]);
    r = rem;
  }

  if (r >= 20) {
    const d = Math.floor(r / 10);
    const u = r % 10;
    parts.push(d === 2 ? veintis[u] : u > 0 ? `${decenas[d]} y ${unidades[u]}` : decenas[d]);
  } else if (r > 0) {
    parts.push(unidades[r]);
  }

  return parts.join(' ');
}

// ── Clause components ─────────────────────────────────────────────────────────

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-bold underline mt-5 mb-1 text-[13px]">{children}</p>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-justify">{children}</p>;
}

function B({ children }: { children: React.ReactNode }) {
  return <strong>{children}</strong>;
}

function EditField({
  value, onChange, width = 'w-32', bold = true, type = 'text',
}: {
  value: string; onChange: (v: string) => void; width?: string; bold?: boolean; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`inline-block ${width} border border-slate-300 rounded px-1 align-baseline
                  ${bold ? 'font-bold' : ''}
                  focus:outline-none focus:ring-1 focus:ring-blue-400
                  print:border-none print:rounded-none print:px-0 print:ring-0 print:bg-transparent print:w-auto
                  ${type === 'number' ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : ''}`}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ContratoPrint({ r }: { r: Reserva }) {
  const [huesped, setHuesped]             = useState(r.huesped);
  const [dni, setDni]                     = useState(r.dni);
  const [direccionInput, setDireccionInput] = useState(r.direccion?.trim() || '___________________________________');
  const [personasInput, setPersonasInput] = useState(String((r.adultos ?? 0) + (r.ninos ?? 0)));
  const [fechaInicioInput, setFechaInicioInput] = useState(fmtFecha(r.fecha_inicio));
  const [horaInicioInput, setHoraInicioInput]   = useState(r.hora_inicio ?? '14:00');
  const [fechaFinInput, setFechaFinInput] = useState(fmtFecha(r.fecha_fin));
  const [horaFinInput, setHoraFinInput]   = useState(r.hora_fin ?? '10:00');
  const [precioInput, setPrecioInput]     = useState(String(Math.round(r.monto_usd ?? 0)));

  const montoUsd  = parseInt(precioInput, 10) || 0;
  const enLetras  = montoUsd > 0 ? numeroALetras(montoUsd) : '—';

  return (
    <div className="min-h-screen bg-white print:min-h-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body  { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 1.8cm 2cm; font-size: 12px; }
        }
      `}</style>

      <PrintButton />

      <div className="max-w-2xl mx-auto px-10 py-10 print:py-0 print:max-w-none print:px-0 text-[13px] leading-relaxed text-black"
           style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>

        {/* Título */}
        <h1 className="text-center font-bold underline text-[14px] mb-1 print:mb-6">
          CONTRATO DE LOCACIÓN TEMPORAL DE VIVIENDA AMOBLADA
        </h1>
        <p className="print:hidden text-center text-slate-400 text-[11px] mb-5">
          Los campos con recuadro se pueden editar antes de imprimir
        </p>

        {/* Encabezado partes */}
        <P>
          Entre <B>Maria Victoria Di Lucca, DNI 31.419.544</B>, representada en este acto por el Sr. Jorge Luis
          Martinez, D.N.I. N° 24280484, en adelante denominada la &quot;LOCADORA&quot;, por una parte, y, por la otra
          el/la Sr/a. <EditField value={huesped} onChange={setHuesped} width="w-56" />, D.N.I. N°{' '}
          <EditField value={dni} onChange={setDni} width="w-32" />, mayor de edad y hábil para este acto, en adelante
          denominado/a como el LOCATARIO, y en conjunto denominados como las <B>PARTES</B> convienen en celebrar el
          presente <B>CONTRATO DE LOCACIÓN TEMPORAL DE VIVIENDA AMOBLADA</B> sujeto a las cláusulas siguientes:
        </P>

        {/* PRIMERA */}
        <Titulo>PRIMERA. OBJETO:</Titulo>
        <P>
          1.1 &nbsp; La LOCADORA entrega en locación al LOCATARIO, quien recibe de plena conformidad, el inmueble
          ubicado en <B>calle San Luis S/N, de la localidad de Desvío Arijón</B> en adelante denominado el INMUEBLE.
        </P>
        <P>
          1.2 &nbsp; El INMUEBLE posee las características y particularidades que se describen en el Anexo adjunto que
          forma parte del presente como así también se entrega con el mobiliario que se consigna en el Anexo
          mencionado; el que es firmado por las PARTES.
        </P>

        {/* SEGUNDA */}
        <Titulo>SEGUNDA. DESTINO:</Titulo>
        <P>
          2.1 &nbsp; El INMUEBLE se destinará exclusivamente a vivienda con fines de turismo, descanso o similares del
          LOCATARIO y sus familiares, hasta un máximo de{' '}
          <EditField value={personasInput} onChange={setPersonasInput} width="w-12" type="number" /> personas, no
          pudiendo variarse este destino ni la cantidad de ocupantes.
        </P>
        <P>
          2.2 &nbsp; También está prohibido al LOCATARIO sub-alquilar, prestar o ceder, total o parcialmente, a título
          oneroso o gratuito, el INMUEBLE, quedando comprendido entre dichas prohibiciones la de transferir este
          contrato, permutar, o realizar cualquier otro negocio jurídico que modifique de algún modo lo aquí pactado;
          renunciando al beneficio de los artículos 1213 y 1214 del Código Civil y Comercial.
        </P>

        {/* TERCERA */}
        <Titulo>TERCERA. PRECIO:</Titulo>
        <P>
          3.1 &nbsp; El precio de la locación se conviene la suma de{' '}
          {enLetras} (
          <EditField value={precioInput} onChange={setPrecioInput} width="w-20" type="number" bold={false} />
          {' '}dólares).
        </P>
        <P>
          3.2 &nbsp; El pago del precio establecido en la cláusula anterior, la LOCADORA lo recibe del LOCATARIO en
          este acto y sirviendo el presente de suficiente recibo.
        </P>
        <P>
          3.3 &nbsp; La falta de cumplimiento en término de las obligaciones a cargo del LOCATARIO, lo hará incurrir
          en mora de pleno derecho y sin necesidad de interpelación judicial ni extrajudicial alguna por el simple
          vencimiento del plazo indicado, debiendo abonar: I) intereses moratorios que se estipulan en una tasa
          equivalente a una vez y media la tasa más elevada que cobre el Nuevo Banco de Santa Fe S.A. en cualesquiera
          de sus operaciones de crédito en el primer día hábil del respectivo mes; e II) intereses punitorios que se
          calcularán en idéntica forma. Las tasas acumuladas se aplicarán sobre el saldo deudor existente en el
          transcurso del respectivo mes y hasta el momento de la efectiva cancelación de todos los conceptos a cargo
          del LOCATARIO pendientes de pago en término.
        </P>

        {/* CUARTA */}
        <Titulo>CUARTA. SERVICIO Y CONSUMOS:</Titulo>
        <P>
          4.1 &nbsp; El pago de los gastos de consumos del servicio de energía eléctrica está a cuenta y cargo del
          LOCATARIO. Estos rubros integran el alquiler además del precio pactado en la cláusula tercera.
        </P>
        <P>
          4.2 &nbsp; Al vencimiento del contrato, la LOCADORA (o los terceros que designe en su representación)
          tomará las mediciones del consumo del mencionado servicio y realizará el cálculo de la tarifa o precio que
          deberá abonar el LOCATARIO.
        </P>
        <P>
          4.3 &nbsp; Si el LOCATARIO se rehúsa a abonar la tarifa o precio del consumo del servicio mencionado
          calculada por la LOCADORA o rechaza el cálculo, ésta podrá descontarlo del depósito de garantía.
        </P>
        <P>
          4.4 &nbsp; El LOCATARIO tiene expresamente prohibido dar de baja el servicio de energía eléctrica o
          transferir a su nombre dichos servicios. En caso de incumplimiento de esta cláusula, será responsable de
          cualquier daño y perjuicio, incluido cualquier gasto atinente a su rehabilitación, reconexión, prestación
          por interrupción del servicio, gastos originados por reparaciones, adecuaciones a nuevos protocolos o
          cumplimiento de obligaciones que fueran ordenadas por las reparticiones públicas competentes o cualquier otra.
        </P>

        {/* QUINTA */}
        <Titulo>QUINTA. PLAZO:</Titulo>
        <P>
          5.1 &nbsp; El plazo total e improrrogable de este contrato, será desde el día{' '}
          <EditField value={fechaInicioInput} onChange={setFechaInicioInput} width="w-24" /> a partir de las{' '}
          <EditField value={horaInicioInput} onChange={setHoraInicioInput} width="w-16" /> horas venciendo el día{' '}
          <EditField value={fechaFinInput} onChange={setFechaFinInput} width="w-24" />, a las{' '}
          <EditField value={horaFinInput} onChange={setHoraFinInput} width="w-16" /> horas.
        </P>
        <P>
          5.2 &nbsp; El LOCATARIO queda notificado en este acto, que el INMUEBLE está destinado únicamente para este
          período, vez que así se acordó entre las partes debido a que el presente es un contrato de locación
          temporal. Por lo tanto el simple hecho de atraso en la restitución, acarrearía un enorme perjuicio a la
          LOCADORA y al posterior locatario.
        </P>

        {/* SEXTA */}
        <Titulo>SEXTA. ESTADO DE INMUEBLE. REPARACIONES. RESTITUCIÓN:</Titulo>
        <P>
          6.1 &nbsp; El LOCATARIO recibe desocupado el INMUEBLE con todos sus elementos, accesorios e instalaciones
          como así también el mobiliario, en perfecto estado de uso, conservación, instalación, pintura y
          funcionamiento, todo lo que es corroborado por el LOCATARIO por haberlo inspeccionado y probado en este
          acto, por lo que lo acepta a su entera conformidad.
        </P>
        <P>
          6.2 &nbsp; A la finalización del contrato, será obligación del LOCATARIO restituir a la LOCADORA tanto el
          INMUEBLE como el mobiliario, en el mismo perfecto estado en que los recibió. Si así no lo hiciese, la
          LOCADORA podrá disponer, sin necesidad de intimación alguna, que se efectúen las reparaciones o repongan
          las partes o mobiliarios rotos o faltantes por cuenta, orden y a cargo del LOCATARIO. Mientras tanto
          seguirá corriendo el alquiler hasta que la LOCADORA vuelva a tener la libre disponibilidad del INMUEBLE y
          el mobiliario a su entera conformidad, sin perjuicio de los demás daños y perjuicios que puedan
          corresponder. La necesidad de las reparaciones o reposiciones, realidad del precio y pago, quedará
          fehacientemente acreditada por el presupuesto y/o factura respectiva.
        </P>
        <P>
          6.3 &nbsp; El INMUEBLE deberá ser entregado limpio y el agua de la piscina en condiciones. En caso de no
          hacerlo la LOCADORA calculará el costo de dichos trabajos, los que serán descontados de lo dado en garantía.
        </P>
        <P>
          6.4 &nbsp; La LOCADORA no será responsable por los daños y/o perjuicios que se le produzcan al LOCATARIO o
          a terceros en sus personas y/o en sus bienes, por causa de roturas, desperfectos, cortocircuitos,
          filtraciones, derrumbes, incendios, inundaciones, averías y/o accidentes, por cualesquiera causas, ya que
          el LOCATARIO toma a su cargo como riesgo propio, incluso el caso fortuito y la fuerza mayor.
        </P>

        {/* SÉPTIMA */}
        <Titulo>SÉPTIMA. MEJORAS:</Titulo>
        <P>
          7.1 &nbsp; Queda prohibida toda modificación y/o mejoras voluntarias en el INMUEBLE y en el mobiliario.
          También el LOCATARIO no podrá retirar ningún mobiliario del INMUEBLE.
        </P>
        <P>
          7.2 &nbsp; Si el LOCATARIO contraviniera esta prohibición, la LOCADORA podrá dejar las mejoras, sin
          compensación alguna, en beneficio del INMUEBLE, o disponer su reparación sin intimación alguna por cuenta,
          orden y a cargo del LOCATARIO, que responderá por los daños y perjuicios.
        </P>

        {/* OCTAVA */}
        <Titulo>OCTAVA. PROHIBICIÓN ESPECIAL:</Titulo>
        <P>
          8.1 &nbsp; Se prohíbe al LOCATARIO depositar aun transitoriamente, materiales inflamables, tóxicos,
          peligrosos o contaminantes en el INMUEBLE.
        </P>
        <P>
          8.2 &nbsp; El LOCATARIO es consciente que el INMUEBLE se encuentra en una zona residencial de viviendas,
          por lo que se le prohíbe realizar fiestas o reuniones que alteren la paz del lugar, o hacer ruidos
          molestos o causar cualquier tipo de malestar a los vecinos.
        </P>
        <P>
          8.3 &nbsp; En caso que la LOCADORA detecte o hubiese denuncia policial en conductas contrarias a las normas
          de convivencia y buenas costumbres u otra actividad que infrinjan cualquier normativa, queda facultada para
          ANULAR EL PRESENTE CONTRATO, perdiendo la suma entregada, sin necesidad de intervención judicial alguna,
          pudiendo la LOCADORA sin más trámites, disponer libremente de la propiedad.
        </P>

        {/* NOVENA */}
        <Titulo>NOVENA. DERECHO DE INSPECCIÓN Y OBLIGACIONES DEL LOCATARIO</Titulo>
        <P>
          9.1 &nbsp; La LOCADORA se reserva el derecho de inspeccionar el INMUEBLE, personalmente o con terceros por
          él designados, en horas diurnas durante todo el plazo contractual.
        </P>
        <P>
          9.2 &nbsp; El LOCATARIO conoce y acepta que el INMUEBLE se encuentra en venta, por tanto permitirá que el
          mismo sea mostrado a posibles interesados en su compra, previo acuerdo de horarios con la LOCADORA.
        </P>
        <P>
          9.3 &nbsp; Será obligación del LOCATARIO permitir el ingreso del personal de mantenimiento de la LOCADORA
          para el desarrollo de aquellas tareas de conservación que puedan ser necesarias en el INMUEBLE como ser el
          jardinero, piletero, entre otros. Queda entendido que el LOCATARIO deberá tomar los recaudos de seguridad
          que estime convenientes y que la LOCADORA no es responsable de eventuales actos ilícitos, por parte del
          jardinero, piletero o sus ayudantes y demás personal de mantenimiento.
        </P>
        <P>
          9.4 &nbsp; Es obligación del LOCATARIO informar fehacientemente a la LOCADORA, dentro de las 24
          (veinticuatro) horas de advertido o producido, cualquier deterioro, anormalidad o desperfecto que afecte en
          cualquier forma al INMUEBLE o al mobiliario, inclusive los que se hubieran producido sin su intervención.
          El incumplimiento de esta obligación implicará su responsabilidad exclusiva y absoluta en lo que respecta a
          los daños que se pudieran ocasionar a causa de la falta de diligencia en la comunicación, atención, y toda
          refacción, reparación, gastos ordinarios, revoques, pinturas, reposiciones y cualquier otro arreglo que
          demande el INMUEBLE, serán por cuenta del LOCATARIO, quien no podrá oponerse a su realización ni reclamar
          indemnización o reintegro.
        </P>

        {/* DÉCIMA */}
        <Titulo>DÉCIMA. DEPÓSITO EN GARANTÍA:</Titulo>
        <P>
          10.1 &nbsp; En garantía del cumplimiento de las obligaciones asumidas en este contrato, la LOCADORA recibe
          en este acto y sirviendo el presente de suficiente recibo, la suma de <B>$0 (pesos cero)</B>, la que no
          devengará intereses.
        </P>
        <P>
          10.2 &nbsp; Tendrá derecho la LOCADORA a retener de este depósito en garantía, todas las sumas adeudadas
          por el LOCATARIO que tengan como fuente esta locación, sean a él mismo o a terceros.
        </P>
        <P>
          10.3 &nbsp; Se prohíbe al LOCATARIO, imputar el depósito dinerario en garantía, al pago de cualesquiera de
          las obligaciones a su cargo.
        </P>
        <P>
          10.4 &nbsp; Restituidos en debida forma el INMUEBLE y el mobiliario, como así también abonado el precio de
          los consumos de los servicios, le será devuelto al locatario la misma cantidad.
        </P>

        {/* DÉCIMA PRIMERA */}
        <Titulo>DÉCIMA PRIMERA. INCUMPLIMIENTOS DEL LOCATARIO:</Titulo>
        <P>
          11 &nbsp; El incumplimiento por parte del LOCATARIO de cualquiera de las obligaciones contraídas,
          producirá la rescisión del contrato por su exclusiva culpa, sin necesidad de intimación judicial o
          extrajudicial, pudiendo la LOCADORA demandar el inmediato desalojo del INMUEBLE, y el pago de los
          alquileres por el término convenido de la locación, además del resarcimiento de los daños y perjuicios
          irrogados, con más los intereses moratorios y punitorios convenidos.
        </P>

        {/* DÉCIMA SEGUNDA */}
        <Titulo>DÉCIMA SEGUNDA. DOMICILIOS:</Titulo>
        <P>12 &nbsp; Quedan constituidos los domicilios especiales, donde tendrán eficacia todas las notificaciones,
          sean extra o judiciales derivadas del presente contrato, en las que seguidamente se indican:</P>
        <ul className="list-disc ml-6 mb-2 space-y-1">
          <li>El LOCATARIO constituye domicilio real en calle{' '}
            <EditField value={direccionInput} onChange={setDireccionInput} width="w-72" />.</li>
          <li>La LOCADORA, en calle Gral. Lopez 2642, 6to B de la ciudad de Santa Fé.</li>
        </ul>

        {/* DÉCIMA TERCERA */}
        <Titulo>DÉCIMA TERCERA. COMPETENCIA JUDICIAL:</Titulo>
        <P>
          13 &nbsp; Para el caso de litigio, las PARTES se someterán a la competencia judicial, de los Tribunales
          Ordinarios de la Ciudad de Santa Fe, renunciando a cualesquiera otras.
        </P>

        {/* DÉCIMA CUARTA */}
        <Titulo>DÉCIMA CUARTA. SELLADO:</Titulo>
        <P>
          14 &nbsp; El sellado correspondiente al presente contrato será por cuenta del LOCATARIO.
        </P>

        {/* Cierre */}
        <P>
          Con la entrega de las llaves del inmueble objeto del presente contrato por parte de la LOCADORA al
          LOCATARIO, quien la recibe de plena conformidad, se da por iniciada la locación, previa lectura y
          ratificación del presente, firmándose dos ejemplares de un mismo tenor y a un solo efecto, en la ciudad de
          Santa Fe, a los ………. días del mes de ………………… de …………
        </P>

        {/* Firmas */}
        <div className="mt-12 grid grid-cols-2 gap-16 text-center text-[12px]">
          <div>
            <div className="border-t border-black pt-2">
              <p>LOCADORA</p>
              <p className="font-bold">Maria Victoria Di Lucca</p>
              <p>DNI 31.419.544</p>
            </div>
          </div>
          <div>
            <div className="border-t border-black pt-2">
              <p>LOCATARIO/A</p>
              <p className="font-bold">{huesped}</p>
              <p>DNI {dni}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
