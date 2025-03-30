import { GameState } from '../models/GameState';
import { UserAction, ActionType, PlayCardPayload, AttackPayload } from '../models/UserAction';
import { PlayerType, PhaseType, CardType } from '../models/types';
import { Card } from '../models/Card';

export class GameUI {
    private gameState!: GameState;
    private actionCallback: (action: UserAction) => void;

    constructor(actionCallback: (action: UserAction) => void) {
        this.actionCallback = actionCallback;
        this.setupEventListeners();
    }

    private setupEventListeners() {
        // End Phase button
        document.getElementById('end-phase')?.addEventListener('click', () => {
            this.actionCallback({ type: ActionType.END_PHASE });
        });
    }

    public updateState(newState: GameState) {
        this.gameState = newState;
        this.render();
    }

    private render() {
        // Update game info
        this.updateElement('current-phase', this.gameState.phase);
        this.updateElement('turn-number', this.gameState.turn.toString());
        this.updateElement('active-player', this.gameState.activePlayer);

        // Update Corp info
        this.updateElement('corp-hp', 
            `${this.gameState.corp.core.currentHp}/${this.gameState.corp.core.maxHp}`);
        this.updateElement('corp-npu',
            `${this.gameState.corp.npuAvailable}/${this.gameState.corp.npuTotal}`);

        // Update Runner info
        this.updateElement('runner-npu',
            `${this.gameState.runner.npuAvailable}/${this.gameState.runner.npuTotal}`);

        // Render fields
        this.renderField('corp-field', this.gameState.corp.field);
        this.renderField('runner-field', this.gameState.runner.field);

        // Render hands (only show runner's hand)
        this.renderHand('runner-hand', this.gameState.runner.hand);
        this.renderHand('corp-hand', 
            Array(this.gameState.corp.hand.length).fill({ type: 'HIDDEN' }));

        // Update event log
        this.renderEventLog();
    }

    private renderField(elementId: string, cards: Card[]) {
        const fieldElement = document.getElementById(elementId);
        if (!fieldElement) return;

        fieldElement.innerHTML = '';
        cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            if (this.gameState.activePlayer === PlayerType.RUNNER && 
                elementId === 'runner-field' && 
                this.gameState.phase === PhaseType.COMBAT) {
                cardElement.classList.add('playable');
                cardElement.addEventListener('click', () => {
                    this.actionCallback({
                        type: ActionType.ATTACK,
                        payload: { programIndex: index }
                    });
                });
            }
            fieldElement.appendChild(cardElement);
        });
    }

    private renderHand(elementId: string, cards: Card[]) {
        const handElement = document.getElementById(elementId);
        if (!handElement) return;

        handElement.innerHTML = '';
        cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            if (this.gameState.activePlayer === PlayerType.RUNNER && 
                elementId === 'runner-hand' && 
                this.gameState.phase === PhaseType.MAIN) {
                cardElement.classList.add('playable');
                cardElement.addEventListener('click', () => {
                    this.actionCallback({
                        type: card.type === CardType.NPU ? ActionType.PLAY_NPU : ActionType.PLAY_CARD,
                        payload: { cardIndex: index, cardType: card.type }
                    });
                });
            }
            handElement.appendChild(cardElement);
        });
    }

    private createCardElement(card: Card | { type: 'HIDDEN' }, index: number): HTMLElement {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.index = index.toString();

        if ('type' in card && card.type === 'HIDDEN') {
            cardElement.classList.add('card-back');
        } else {
            const typedCard = card as Card;
            cardElement.innerHTML = `
                <div class="card-name">${typedCard.name}</div>
                <div class="card-type">${typedCard.type}</div>
                ${typedCard.power ? `<div class="card-power">Power: ${typedCard.power}</div>` : ''}
                ${typedCard.ascii ? `<div class="card-art">${typedCard.ascii}</div>` : ''}
                ${typedCard.flavorText ? `<div class="card-flavor">${typedCard.flavorText}</div>` : ''}
            `;
        }

        return cardElement;
    }

    private renderEventLog() {
        const logElement = document.getElementById('event-log');
        if (!logElement) return;

        const recentEvents = this.gameState.eventLog.slice(-5);
        logElement.innerHTML = recentEvents
            .map(entry => `<div class="log-entry">${entry.message}</div>`)
            .join('');
        
        // Auto-scroll to bottom
        logElement.scrollTop = logElement.scrollHeight;
    }

    private updateElement(elementId: string, value: string) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
} 