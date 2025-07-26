# Cobalt Mobile - Advanced Astrophotography Control Platform

A comprehensive, mobile-first astrophotography equipment control and automation platform built with Next.js, React, TypeScript, and advanced simulation capabilities.

## 🚀 Features

### Core Functionality
- **Real-time Equipment Control**: Camera, mount, focuser, and filter wheel management
- **Advanced Sequencing**: Intelligent sequence planning with AI-powered suggestions
- **Environmental Monitoring**: Live weather and seeing condition tracking
- **Equipment Profiles**: Save and manage multiple equipment configurations
- **Real-time Monitoring**: Live performance metrics and alerts
- **Enhanced Simulation**: Realistic equipment behavior and environmental effects

### User Interface
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Enhanced Navigation**: Intuitive bottom navigation with status indicators
- **Loading States**: Smooth transitions and performance feedback
- **Error Handling**: Comprehensive error boundaries and recovery
- **Dark/Light Mode**: Automatic theme switching
- **Performance Monitoring**: Built-in performance tracking and optimization

### Advanced Features
- **Equipment Profiles**: Manage multiple telescope/camera setups
- **Sequence Planner**: AI-assisted imaging session planning
- **Real-time Monitor**: Live equipment and environmental monitoring
- **Data Visualization**: Charts and graphs for performance tracking
- **Export/Import**: Save and share configurations and sequences

## 🛠 Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Components**: Custom components with Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with CSS Variables

## 📱 Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/cobalt-mobile.git
cd cobalt-mobile
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm run start
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with error boundary
│   └── page.tsx           # Main application component
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── enhanced-navigation.tsx
│   │   ├── loading-states.tsx
│   │   └── ...
│   ├── enhanced-dashboard.tsx
│   ├── equipment-profiles.tsx
│   ├── real-time-monitor.tsx
│   ├── advanced-sequence-planner.tsx
│   ├── error-boundary.tsx
│   └── ...
├── hooks/                # Custom React hooks
│   ├── use-performance.ts
│   └── use-mobile.tsx
├── lib/                  # Utilities and services
│   ├── simulation-engine.ts
│   ├── store.ts
│   └── utils.ts
└── ...
```

## 🎯 Key Components

### Enhanced Simulation Engine (`src/lib/simulation-engine.ts`)
- Realistic equipment behavior simulation
- Environmental condition modeling
- Error condition simulation
- Performance metrics tracking

### Equipment Profiles (`src/components/equipment-profiles.tsx`)
- Save multiple equipment configurations
- Calculate field of view and image scale
- Import/export profile data
- Equipment compatibility checking

### Real-time Monitor (`src/components/real-time-monitor.tsx`)
- Live environmental data tracking
- Equipment health monitoring
- Alert system with notifications
- Performance metrics visualization

### Advanced Sequence Planner (`src/components/advanced-sequence-planner.tsx`)
- AI-powered sequence optimization
- Target database with recommendations
- Weather and moon phase considerations
- Intelligent exposure planning

### Performance Monitoring (`src/hooks/use-performance.ts`)
- Component render time tracking
- Memory usage monitoring
- Frame rate measurement
- Async operation timing

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# Development settings
NODE_ENV=development
NEXT_PUBLIC_APP_VERSION=1.0.0

# Performance monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true

# Simulation settings
NEXT_PUBLIC_SIMULATION_REALISM=realistic
NEXT_PUBLIC_ERROR_RATE=0.05
```

### Customization
The application can be customized through:

- **Theme Configuration**: Modify `src/app/globals.css` for custom themes
- **Simulation Parameters**: Adjust `src/lib/simulation-engine.ts` for different behaviors
- **Equipment Profiles**: Add custom equipment in `src/components/equipment-profiles.tsx`
- **UI Components**: Extend components in `src/components/ui/`

## 🧪 Testing

Run the test suite:
```bash
npm test
# or
yarn test
# or
pnpm test
```

### Test Coverage
- Unit tests for utility functions
- Component integration tests
- Simulation engine validation
- Performance benchmarks

## 📊 Performance

The application includes built-in performance monitoring:

- **Render Performance**: Component render time tracking
- **Memory Usage**: JavaScript heap monitoring
- **Frame Rate**: Real-time FPS measurement
- **Network Performance**: API call timing
- **User Experience**: Loading state optimization

### Performance Features
- Debounced user interactions
- Lazy loading for heavy components
- Optimized re-renders with React.memo
- Efficient state management with Zustand
- Progressive loading with skeleton states

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on push

### Docker
```bash
# Build the Docker image
docker build -t cobalt-mobile .

# Run the container
docker run -p 3000:3000 cobalt-mobile
```

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use the existing component patterns
- Add tests for new features
- Update documentation
- Ensure responsive design

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the excellent framework
- Tailwind CSS for the utility-first CSS framework
- Framer Motion for smooth animations
- Lucide for beautiful icons
- The astrophotography community for inspiration

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for the astrophotography community**
