// Используем только существующие иконки из lucide-react
import { 
  Zap, 
  Palette, 
  DollarSign, 
  Package, 
  CheckCircle2, 
  Star, 
  HelpCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Handshake, 
  Rocket, 
  Award, 
  Users, 
  ShoppingBag, 
  Gift, 
  Pen, 
  Usb, 
  Shirt, 
  Leaf, 
  Folder, 
  Camera, 
  TrendingUp, 
  Heart, 
  Smile, 
  Bell, 
  Home, 
  Search, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Link, 
  Download, 
  Upload, 
  Image, 
  Video, 
  Music, 
  File, 
  Code, 
  Gamepad2, 
  Coffee,
  Bolt,
  Paintbrush,
  Box,
  CheckCircle,
  Mail as MailIcon
} from 'lucide-react'

interface IconProps {
  name: string
  size?: number | string
  color?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Умный компонент иконки
 * Использует только lucide-react для надежности
 */
export default function Icon({ name, size = 24, color, className = '', style = {} }: IconProps) {
  const iconMap: Record<string, React.ComponentType<any>> = {
    // Основные действия
    'lightning': Bolt,
    'zap': Zap,
    'bolt': Bolt,
    'palette': Palette,
    'paint': Paintbrush,
    'dollar': DollarSign,
    'money': DollarSign,
    'box': Package,
    'package': Box,
    'check': CheckCircle2,
    'success': CheckCircle,
    'star': Star,
    'question': HelpCircle,
    'help': HelpCircle,
    
    // Контакты
    'email': Mail,
    'mail': MailIcon,
    'phone': Phone,
    'call': Phone,
    'location': MapPin,
    'map': MapPin,
    'clock': Clock,
    'time': Clock,
    
    // Бизнес
    'handshake': Handshake,
    'rocket': Rocket,
    'award': Award,
    'users': Users,
    'team': Users,
    'user': User,
    'shopping': ShoppingBag,
    'cart': ShoppingBag,
    'gift': Gift,
    'present': Gift,
    
    // Продукты сувениров
    'pen': Pen,
    'writing': Pen,
    'usb': Usb,
    'flash': Usb,
    'shirt': Shirt,
    'tshirt': Shirt,
    'leaf': Leaf,
    'eco': Leaf,
    'folder': Folder,
    'notebook': Folder,
    
    // Социальные сети
    'camera': Camera,
    'photo': Camera,
    'trending': TrendingUp,
    'chart': TrendingUp,
    'heart': Heart,
    'like': Heart,
    'smile': Smile,
    'happy': Smile,
    'bell': Bell,
    'notification': Bell,
    
    // Навигация
    'home': Home,
    'search': Search,
    'find': Search,
    'profile': User,
    'plus': Plus,
    'add': Plus,
    'edit': Edit,
    'change': Edit,
    'trash': Trash2,
    'delete': Trash2,
    'save': Save,
    'store': Save,
    'close': X,
    'cancel': X,
    'next': ChevronRight,
    'right': ChevronRight,
    'prev': ChevronLeft,
    'left': ChevronLeft,
    'down': ChevronDown,
    'expand': ChevronDown,
    'up': ChevronUp,
    'collapse': ChevronUp,
    
    // Медиа
    'share': Share2,
    'link': Link,
    'url': Link,
    'download': Download,
    'upload': Upload,
    'image': Image,
    'picture': Image,
    'video': Video,
    'movie': Video,
    'music': Music,
    'audio': Music,
    'file': File,
    'document': File,
    'code': Code,
    'programming': Code,
    'game': Gamepad2,
    'gaming': Gamepad2,
    'coffee': Coffee,
    'drink': Coffee,
  }

  const IconComponent = iconMap[name.toLowerCase()] || HelpCircle

  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      style={style}
    />
  )
}
