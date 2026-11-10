import React from 'react';
import {
  Users,
  Car,
  Dog,
  Bed,
  Flame,
  ShieldCheck,
  Trash2,
  CigaretteOff,
  Waves,
  Home,
  Zap,
  Volume2,
  Ban,
  Lightbulb,
  FileText,
  Sparkles
} from 'lucide-react';

interface RuleItem {
  id: number;
  icon: React.ElementType;
  text: React.ReactNode;
  warning?: boolean;
}

export default function ReglamentoSection() {
  const reglas: RuleItem[] = [
    {
      id: 1,
      icon: Users,
      warning: true,
      text: (
        <>
          <strong>EL ALQUILER TEMPORARIO DE LA CASA ES PARA EL GRUPO QUE CONTRATA</strong>, POR LO TANTO ESTÁ <strong>TERMINANTEMENTE PROHIBIDO HACER FIESTAS E INVITAR GENTE QUE NO ESTÉ DENTRO DEL GRUPO ACORDADO PREVIAMENTE</strong>. <em>(NO SE PERMITEN INVITADOS A PASAR EL DÍA O LA NOCHE O SIMILAR).</em>
        </>
      ),
    },
    {
      id: 2,
      icon: Car,
      text: (
        <>
          <strong>ÁREA DE ESTACIONAMIENTO:</strong> Entrada por el primer portón, zona de adoquines y primer galería.
          <br />
          <span className="text-red-700 font-semibold">Los autos NO SE PUEDEN ESTACIONAR EN EL PARQUE NI EN LA SEGUNDA GALERÍA</span>, sólo en las ÁREAS DE ESTACIONAMIENTO.
        </>
      ),
    },
    {
      id: 3,
      icon: Dog,
      warning: true,
      text: (
        <>
          Se admite sólo <strong>UNA MASCOTA</strong>, QUE <strong>SÓLO PUEDE ENTRAR A LA CASA EN LA ZONA DE QUINCHO</strong> y está <strong>TERMINANTEMENTE PROHIBIDO METER LA MASCOTA A LA PILETA</strong>.
        </>
      ),
    },
    {
      id: 4,
      icon: Bed,
      text: (
        <>
          Recordá traer <strong>juego de sábanas y toallas</strong> y cuestiones de <strong>aseo personal</strong> (Shampoo, jabón, crema). Todas las camas son simples excepto 2 matrimoniales (de 1,60m y de 1,80m).
        </>
      ),
    },
    {
      id: 5,
      icon: Flame,
      warning: true,
      text: (
        <>
          Está terminantemente <strong>PROHIBIDO EL USO DE PIROTECNIA, ARMAS DE FUEGO O CUALQUIER ARTEFACTO PELIGROSO</strong>. También está prohibido el uso de velas o similar.
        </>
      ),
    },
    {
      id: 6,
      icon: ShieldCheck,
      text: (
        <>
          <strong>HABRÁN DOS PERSONAS ENCARGADAS DE CONTROLAR DIARIAMENTE EL BUEN USO DE LAS INSTALACIONES.</strong>
        </>
      ),
    },
    {
      id: 7,
      icon: Trash2,
      text: (
        <>
          <strong>LA BASURA</strong> se <strong>TIRA EN LOS CESTOS DE BASURA</strong> distribuidos en cocina, baños y quincho. Al final de la estadía se debe juntar las bolsas de basura y ubicarlas en el cesto cercano al ingreso del primer portón <em>(NO EN EL SUELO O ARRIBA DE ALGUNA MESA PORQUE ENTRAN PERROS Y LAS DESTRUYEN)</em>.
        </>
      ),
    },
    {
      id: 8,
      icon: CigaretteOff,
      warning: true,
      text: (
        <>
          <strong>ESTÁ PROHIBIDO FUMAR DENTRO DE LA CASA.</strong> Sólo se permite fumar afuera de la casa. Tirá la <strong>COLILLA DE CIGARRILLO</strong> en los <strong>CESTOS DE BASURA</strong>. NO en el parque o plantas. <em>(LATAS DE ARENA PARA LAS COLILLAS)</em>.
        </>
      ),
    },
    {
      id: 9,
      icon: Waves,
      warning: true,
      text: (
        <>
          <strong>PROHIBIDO EL INGRESO A LA PILETA CON COMIDA O BEBIDA.</strong>
        </>
      ),
    },
    {
      id: 10,
      icon: Home,
      text: (
        <>
          <strong>LA CASA DEBE QUEDAR EN LAS MISMAS CONDICIONES EN LA QUE SE ENTREGA. Y DEJAR CADA COSA EN SU DEBIDO LUGAR.</strong>
        </>
      ),
    },
    {
      id: 11,
      icon: Zap,
      text: (
        <>
          Les pedimos que sean <strong>cuidadosos con el uso de los recursos</strong> como el agua y la energía eléctrica.
        </>
      ),
    },
    {
      id: 12,
      icon: Volume2,
      text: (
        <>
          El <strong>volumen de la música debe ser suave</strong>, respetando al entorno y a los vecinos.
        </>
      ),
    },
    {
      id: 13,
      icon: Ban,
      text: (
        <>
          Por favor, <strong>no tiren papeles ni toallas higiénicas en los inodoros</strong> para ello disponen de cestos de residuos.
        </>
      ),
    },
    {
      id: 14,
      icon: Lightbulb,
      text: (
        <>
          Les recomendamos <strong>no dejar luces prendidas que dan a la pileta</strong> para así evitar la aglomeración de Bichos dentro de la misma.
        </>
      ),
    },
  ];

  return (
    <div className="mt-10 pt-8 border-t-2 border-dashed border-slate-200 print:border-none print:pt-0 print:mt-0 print:break-before-page">
      {/* Encabezado del reglamento */}
      <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-900 text-white shadow-sm print:bg-slate-800">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base print:text-sm flex items-center gap-2 uppercase tracking-wide">
              REGLAMENTO CASONA
            </h2>
            <p className="text-xs text-slate-500">
              Lee atentamente los 14 puntos:
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 print:text-[10px]">
          14 PUNTOS
        </span>
      </div>

      {/* Lista de 14 puntos */}
      <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3 print:gap-2.5">
        {reglas.map((r) => {
          const IconComponent = r.icon;
          return (
            <div
              key={r.id}
              className={`bg-white rounded-xl border p-3.5 print:p-2.5 transition-all text-xs print:text-[10.5px] leading-relaxed flex items-start gap-3 print:break-inside-avoid ${
                r.warning
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white print:bg-slate-800 text-[11px] print:text-[9.5px] font-bold flex items-center justify-center shadow-xs">
                  {r.id}
                </span>
                <IconComponent
                  size={15}
                  className={r.warning ? 'text-amber-600 print:text-amber-700' : 'text-slate-400 print:text-slate-500'}
                />
              </div>

              <div className="text-slate-700 space-y-0.5 flex-1">
                {r.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Nota final de agradecimiento */}
      <div className="mt-4 print:mt-3 p-3 rounded-xl bg-slate-900 text-white text-center print:bg-slate-800 print:p-2.5 print:break-inside-avoid shadow-xs">
        <p className="text-xs print:text-[11px] font-semibold flex items-center justify-center gap-1.5">
          <Sparkles size={14} className="text-amber-400" />
          Gracias por respetar el reglamento y que tengan una hermosa estadía.
        </p>
      </div>
    </div>
  );
}
