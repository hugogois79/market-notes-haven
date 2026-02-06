
# Plano: Widget de Calendario Diario (estilo Superhuman)

## Objetivo
Criar um widget lateral direito que mostra o calendario do dia atual com os eventos, semelhante ao Superhuman. Incluir uma opcao de toggle para ativar/desativar a visibilidade do widget.

## Referencia Visual
Baseado na imagem do Superhuman:
- Barra vertical a direita com horas (1am - 11pm)
- Eventos coloridos por categoria
- Mostra titulo e horario do evento
- Data atual no topo (ex: "Fri, Feb 6")
- Design compacto e minimalista

## Arquitetura da Solucao

```text
+-------------------+------------------+------------------+
|                   |                  |                  |
|    Sidebar        |   Conteudo       |   Calendar       |
|    (esquerda)     |   Principal      |   Widget         |
|                   |                  |   (direita)      |
|                   |                  |                  |
+-------------------+------------------+------------------+
```

## Componentes a Criar

| Ficheiro | Descricao |
|----------|-----------|
| `src/components/calendar/DailyCalendarWidget.tsx` | Widget principal com timeline de horas |
| `src/components/calendar/CalendarToggle.tsx` | Botao toggle para mostrar/esconder widget |
| `src/hooks/useDailyCalendarEvents.ts` | Hook para buscar eventos do dia |
| `src/hooks/useCalendarWidgetSettings.ts` | Hook para persistir estado do toggle |

## Ficheiros a Modificar

| Ficheiro | Alteracao |
|----------|-----------|
| `src/layouts/MainLayout.tsx` | Adicionar area lateral direita para o widget |
| `src/components/AppContent.tsx` | Providenciar contexto de settings do widget |

## Funcionalidades

1. **Timeline Vertical**
   - Mostra horas de 6am a 11pm
   - Linha indicadora da hora atual
   - Eventos posicionados por periodo (manha/tarde)

2. **Eventos do Dia**
   - Busca da tabela `calendar_events` para a data atual
   - Cores baseadas em categoria (usando `useCalendarCategories`)
   - Hover card com detalhes do evento

3. **Toggle de Visibilidade**
   - Icone de calendario no header
   - Estado guardado em localStorage
   - Animacao suave ao abrir/fechar

4. **Navegacao de Data**
   - Setas para dia anterior/proximo
   - Click na data volta ao dia atual

## Secao Tecnica

### Estrutura do Widget

```typescript
interface DailyCalendarWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

// Eventos vindos do Supabase (calendar_events)
interface CalendarEvent {
  id: string;
  date: string;        // "2026-02-06"
  title: string;
  category: string;    // "legal", "work", etc.
  period: string;      // "morning" | "afternoon"
  notes: string | null;
}
```

### Query de Dados

Reutiliza a estrutura existente do `YearCalendar.tsx`:

```typescript
const { data: events } = useQuery({
  queryKey: ["daily-calendar-events", selectedDate],
  queryFn: async () => {
    const { data } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("date", selectedDate)
      .eq("user_id", user.id);
    return data;
  },
});
```

### Persistencia do Toggle

```typescript
const WIDGET_STORAGE_KEY = "calendar-widget-visible";

const [isVisible, setIsVisible] = useState(() => {
  const saved = localStorage.getItem(WIDGET_STORAGE_KEY);
  return saved !== null ? JSON.parse(saved) : true;
});
```

### Layout Responsivo

```typescript
// MainLayout.tsx - Nova estrutura
<div className="flex min-h-screen">
  <Sidebar />
  <main className="flex-1">
    {children}
  </main>
  {calendarWidgetVisible && (
    <DailyCalendarWidget onClose={() => setCalendarWidgetVisible(false)} />
  )}
</div>
```

### Mapeamento de Periodos para Horas

- `morning` -> 9:00 - 12:00
- `afternoon` -> 14:00 - 18:00

## Sequencia de Implementacao

1. Criar hook `useDailyCalendarEvents` para fetch de eventos
2. Criar hook `useCalendarWidgetSettings` para toggle state
3. Criar componente `DailyCalendarWidget`
4. Criar componente `CalendarToggle`
5. Integrar no `MainLayout` com layout flex
6. Adicionar toggle no header ou numa posicao fixa
7. Testar responsividade e mobile (esconder automaticamente)

## Consideracoes

- **Mobile**: Widget escondido por defeito em ecras pequenos
- **Performance**: Query apenas quando widget visivel
- **Acessibilidade**: Suporte a keyboard navigation
- **Tema**: Usar cores do sistema (dark/light mode)

