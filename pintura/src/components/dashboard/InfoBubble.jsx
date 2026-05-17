import React, { useMemo } from 'react';
import { ClockIcon } from '../common/Icons';
import { useSettings } from '../../context/SettingsContext';

export default function InfoBubble({ activeReminder, activePet }) {
  const { t, language } = useSettings();

  const tips = useMemo(() => ({
    'Perro': [
      language === 'en' ? "Don't forget the daily walk! It helps release energy." : language === 'pt' ? "Não esqueça o passeio diário! Ajuda a liberar energia." : "¡No olvides el paseo diario! Ayuda a liberar energía.",
      language === 'en' ? "Fresh water is vital for their hydration today." : language === 'pt' ? "Água fresca é vital para a hidratação hoje." : "El agua fresca es vital para su hidratación hoy.",
      language === 'en' ? "A bit of play strengthens your bond with them." : language === 'pt' ? "Um pouco de brincadeira fortalece seu vínculo." : "Un ratito de juego fortalece tu vínculo con ellos.",
      language === 'en' ? "Check if their vaccines are up to date this month." : language === 'pt' ? "Verifique se as vacinas estão em dia este mês." : "Revisa si sus vacunas están al día este mes."
    ],
    'Gato': [
      language === 'en' ? "Cleaning their litter box is key to their comfort." : language === 'pt' ? "A limpeza da caixa de areia é a chave para o conforto." : "La limpieza de su arena es clave para su comodidad.",
      language === 'en' ? "A new scratcher will prevent them from using your furniture." : language === 'pt' ? "Um novo arranhador evitará que usem seus móveis." : "Un rascador nuevo evitará que use tus muebles.",
      language === 'en' ? "Brushing their fur prevents annoying hairballs." : language === 'pt' ? "Escovar os pelos evita bolas de pelo irritantes." : "Cepillar su pelo evita las molestas bolas de pelo.",
      language === 'en' ? "Playing with laser pointers stimulates their hunting instinct." : language === 'pt' ? "Brincar com ponteiras laser estimula o instinto caçador." : "Jugar con punteros láser estimula su instinto cazador."
    ],
    'Ave': [
      language === 'en' ? "Make sure there are no drafts nearby." : language === 'pt' ? "Certifique-se de que não haja correntes de ar por perto." : "Asegúrate de que no haya corrientes de aire cerca.",
      language === 'en' ? "Fresh fruits are a delicious treat today." : language === 'pt' ? "Frutas frescas são um petisco delicioso hoje." : "Las frutas frescas son un premio delicioso hoy.",
      language === 'en' ? "Clean their water bowl to prevent bacteria." : language === 'pt' ? "Limpe o bebedouro para evitar bactérias." : "Limpia su bebedero para evitar bacterias.",
      language === 'en' ? "A bit of indirect sunlight is very good for them." : language === 'pt' ? "Um pouco de sol indireto faz muito bem." : "Un ratito de sol indirecto les hace muy bien."
    ],
    'Conejo': [
      language === 'en' ? "Hay should always be available for their teeth." : language === 'pt' ? "O feno deve estar sempre disponível para os dentes." : "El heno debe estar siempre disponible para sus dientes.",
      language === 'en' ? "Check that they have enough space to jump today." : language === 'pt' ? "Verifique se eles têm espaço suficiente para pular hoje." : "Revisa que tenga espacio suficiente para saltar hoy.",
      language === 'en' ? "Green leafy vegetables are their favorites." : language === 'pt' ? "Vegetais de folhas verdes são os seus favoritos." : "Las verduras de hoja verde son sus favoritas.",
      language === 'en' ? "A gentle brushing will help them feel pampered." : language === 'pt' ? "Uma escovação suave ajudará a sentirem-se mimados." : "Un cepillado suave le ayudará a sentirse mimado."
    ],
    'Default': [
      language === 'en' ? "Remember to always keep fresh water available." : language === 'pt' ? "Lembre-se de manter sempre água fresca disponível." : "Recuerda mantener siempre agua fresca disponible.",
      language === 'en' ? "Affection is the best medicine for your pet." : language === 'pt' ? "O carinho é o melhor remédio para o seu pet." : "El cariño es la mejor medicina para tu mascota.",
      language === 'en' ? "An annual preventive check-up is essential." : language === 'pt' ? "Um check-up preventivo anual é fundamental." : "Un chequeo preventivo al año es fundamental.",
      language === 'en' ? "Always observe any change in their appetite." : language === 'pt' ? "Observe sempre qualquer mudança no apetite." : "Observa siempre cualquier cambio en su apetito."
    ]
  }), [language]);

  const randomTip = useMemo(() => {
    const speciesTips = tips[activePet?.tipo] || tips['Default'];
    return speciesTips[Math.floor(Math.random() * speciesTips.length)];
  }, [activePet, tips]);

  const timeLocale = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-ES';

  return (
    <div className="w-full max-w-sm mb-8 z-30 animate-float-gentle relative pointer-events-none">
      <div className="bg-[#e6fcfb] rounded-[2rem] p-5 shadow-[0_20px_40px_-15px_rgba(45,155,150,0.4)] relative border-4 border-white pointer-events-auto">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2d9b96] text-white px-6 py-1.5 rounded-full font-black text-lg shadow-md whitespace-nowrap">
          {activeReminder ? t('home_reminder_label') : t('home_tip_label')}
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-3 text-center min-h-[60px]">
          {activeReminder ? (
            <>
              <div className="flex-shrink-0 text-[#2d9b96]">
                <ClockIcon />
              </div>
              <p className="text-[#1a5d5a] font-bold text-lg leading-tight">
                {activeReminder.titulo} {language === 'en' ? 'at' : language === 'pt' ? 'às' : 'a las'} <br/>
                <span className="font-black">{new Date(activeReminder.fechaHora).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </>
          ) : (
            <p className="text-[#1a5d5a] font-bold text-lg leading-tight italic">
              {randomTip}
            </p>
          )}
        </div>

        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-t-[25px] border-t-[#e6fcfb] border-r-[15px] border-r-transparent drop-shadow-md"></div>
        <div className="absolute -bottom-[29px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[18px] border-l-transparent border-t-[30px] border-t-white border-r-[18px] border-r-transparent -z-10"></div>
      </div>
    </div>
  );
}
