// src/utils/disasterConfig.js

const DISASTER_CONFIG = {
  earthquake: {
    color: '#FF0000',
    bgColor: '#FFE6E6',
    icon: '🏚️',
    title: 'EARTHQUAKE ALERT',
    message: 'Strong shaking detected. Take cover under sturdy furniture and stay away from windows.',
    actionText: 'TAKE COVER NOW'
  },
  tsunami: {
    color: '#8B0000',
    bgColor: '#FFE0E0',
    icon: '🌊',
    title: 'TSUNAMI WARNING',
    message: 'Tsunami waves possible. Move to higher ground immediately and avoid coastal areas.',
    actionText: 'EVACUATE TO HIGH GROUND'
  },
  cyclone: {
    color: '#FF8C00',
    bgColor: '#FFF4E6',
    icon: '🌪️',
    title: 'CYCLONE ALERT',
    message: 'Severe storm approaching. Secure loose items and stay indoors in a safe room.',
    actionText: 'STAY INDOORS & SECURE'
  },
  flood: {
    color: '#1E90FF',
    bgColor: '#E6F3FF',
    icon: '🌊',
    title: 'FLOOD WARNING',
    message: 'Rising water levels. Avoid low-lying areas and never cross flooded roads.',
    actionText: 'AVOID FLOODED AREAS'
  }
};

export default DISASTER_CONFIG;
