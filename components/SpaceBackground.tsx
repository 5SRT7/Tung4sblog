'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

interface Star {
  x: number
  y: number
  z: number
  size: number
  speed: number
  opacity: number
  trailLength: number
  trailOpacity: number[]
  color: string
  vx: number // 横向速度
  vy: number // 纵向速度
}

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const { resolvedTheme } = useTheme()

  const [stars, setStars] = useState<Star[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)

  // 星星颜色配置 - 根据主题调整
  const getStarColors = (theme: string) => {
    if (theme === 'light') {
      return [
        '#ec4899', // 主粉色
        '#db2777', // 深粉色
        '#be185d', // 更深的粉色
        '#f472b6', // 浅粉色
        '#f9a8d4', // 更浅的粉色
      ]
    } else {
      return [
        '#ffffff', // 纯白
        '#f8fafc', // 淡白
        '#e2e8f0', // 灰白
        '#cbd5e1', // 浅灰
        '#94a3b8', // 中灰
      ]
    }
  }

  // Initialize stars
  useEffect(() => {
    const initializeStars = () => {
      const starCount = 1500
      const colors = getStarColors(resolvedTheme || 'dark')
      const newStars: Star[] = []

      for (let i = 0; i < starCount; i++) {
        // 使用更真实的分布 - 更多的远处小星星
        const depthType = Math.random()
        let depth, size, opacity, speed
        if (depthType < 0.6) {
          // 60% 的星星在远处 - 速度大幅降低
          depth = Math.random() * 0.5 + 0.5 // 0.5 - 1.0
          size = Math.random() * 0.6 + 0.1
          opacity = Math.random() * 0.3 + 0.05
          speed = Math.random() * 0.0005 + 0.0001 // 大幅降低速度
        } else {
          // 40% 的星星在中等距离 - 速度降低
          depth = Math.random() * 0.3 + 0.2 // 0.2 - 0.5
          size = Math.random() * 1 + 0.5
          opacity = Math.random() * 0.5 + 0.2
          speed = Math.random() * 0.001 + 0.0003 // 降低速度
        } 
        // 为星星添加随机横向速度，模拟从身边划过的效果 - 降低横向速度
        const angle = Math.random() * Math.PI * 2
        const velocityScale = (1 - depth) * 0.005 // 降低横向速度系数
        newStars.push({
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
          z: depth,
          size: size,
          speed: speed,
          opacity: opacity,
          trailLength: Math.floor(Math.random() * 3) + 2,
          trailOpacity: Array(Math.floor(Math.random() * 3) + 2)
            .fill(0)
            .map((_, i) => (i + 1) * 0.15), // 递增的透明度
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: Math.cos(angle) * velocityScale,
          vy: Math.sin(angle) * velocityScale
        })
      }
      setStars(newStars)
    }
    initializeStars()
  }, [resolvedTheme])
  // Handle mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1

      setMousePosition({ x, y })
    }

    const handleMouseDown = () => setIsMouseDown(true)
    const handleMouseUp = () => setIsMouseDown(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || stars.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const animate = () => {
      // 设置背景颜色
      if (resolvedTheme === 'light') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else {
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // 微弱的背景星星
        ctx.save()
        ctx.globalAlpha = 0.02
        ctx.fillStyle = '#ffffff'
        for (let i = 0; i < 80; i++) {
          const x = Math.random() * canvas.width
          const y = Math.random() * canvas.height
          const size = Math.random() * 0.3
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // Update and draw stars
      const updatedStars = stars.map(star => {
        // 应用透视投影
        const scale = 1 / star.z
        const x = centerX + star.x * centerX * scale
        const y = centerY + star.y * centerY * scale

        // 减小视差效果
        const parallaxX = mousePosition.x * 8 * star.z
        const parallaxY = mousePosition.y * 8 * star.z

        // 计算当前速度 - 适度增加速度
        const baseSpeedMultiplier = isMouseDown ? 3 : speedMultiplier
        const currentSpeed = star.speed * baseSpeedMultiplier

        // 更新星星位置 - 向观察者移动并添加横向移动
        star.z -= currentSpeed
        star.x += star.vx * currentSpeed * 10
        star.y += star.vy * currentSpeed * 10

        // 重置条件 - 当星星太近或飞出屏幕时重置
        const isOutOfBounds = Math.abs(star.x) > 1.5 || Math.abs(star.y) > 1.5
        if (star.z <= 0.02 || isOutOfBounds) {
          // 重置星星到远处
          const depthType = Math.random()
          if (depthType < 0.7) {
            star.z = Math.random() * 0.5 + 0.5
            star.speed = Math.random() * 0.0005 + 0.0001 // 同步更新重置后的速度
          } else if (depthType < 0.95) {
            star.z = Math.random() * 0.3 + 0.2
            star.speed = Math.random() * 0.001 + 0.0003 // 同步更新重置后的速度
          } else {
            star.z = Math.random() * 0.15 + 0.05
            star.speed = Math.random() * 0.002 + 0.0008 // 同步更新重置后的速度
          }
          
          // 重置位置在屏幕范围内
          star.x = Math.random() * 1.8 - 0.9
          star.y = Math.random() * 1.8 - 0.9
          
          // 重置速度和方向 - 降低重置后的横向速度
          const angle = Math.random() * Math.PI * 2
          const velocityScale = (1 - star.z) * 0.005 // 降低重置后的横向速度
          star.vx = Math.cos(angle) * velocityScale
          star.vy = Math.sin(angle) * velocityScale
          
          const colors = getStarColors(resolvedTheme || 'dark')
          star.color = colors[Math.floor(Math.random() * colors.length)]
        }

        // 判断是否处于高速状态
        const isHighSpeed = baseSpeedMultiplier > 1
        
        // 高速时绘制星球大战风格的线条拖尾
        if (isHighSpeed) {
          ctx.save()
          
          // 计算拖尾方向（运动反方向）
          const trailDirectionX = -star.vx
          const trailDirectionY = -star.vy
          
          // 根据速度计算拖尾长度
          const trailLength = Math.min(currentSpeed * 1000 * star.z, 200)
          
          // 拖尾起点和终点
          const startX = x + parallaxX
          const startY = y + parallaxY
          const endX = startX + trailDirectionX * trailLength
          const endY = startY + trailDirectionY * trailLength
          
          // 创建线性渐变拖尾
          const gradient = ctx.createLinearGradient(startX, startY, endX, endY)
          const endColor = resolvedTheme === 'light' ? '#ffffff00' : '#00000000'
          gradient.addColorStop(0, star.color)
          gradient.addColorStop(0.7, star.color + '80') // 半透明
          gradient.addColorStop(1, endColor)
          
          // 绘制拖尾线条
          ctx.strokeStyle = gradient
          ctx.lineWidth = Math.min(star.size * scale * 2, 3)
          ctx.globalAlpha = star.opacity * (0.5 + currentSpeed * 10)
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()
          
          ctx.restore()
        } else {
          // 正常速度下的拖尾效果
          if (star.trailLength > 0) {
            ctx.save()
            for (let i = 0; i < star.trailLength; i++) {
              const trailZ = star.z + (i + 1) * 0.1
              const trailScale = 1 / trailZ
              const trailX = centerX + star.x * centerX * trailScale + parallaxX
              const trailY = centerY + star.y * centerY * trailScale + parallaxY

              ctx.globalAlpha = star.trailOpacity[i] || 0.1
              ctx.fillStyle = star.color
              ctx.beginPath()
              ctx.arc(trailX, trailY, star.size * 0.3, 0, Math.PI * 2)
              ctx.fill()
            }
            ctx.restore()
          }
        }

        // 绘制主星星
        ctx.save()
        
        if (resolvedTheme === 'dark' && star.size > 1) {
          ctx.shadowBlur = 10
          ctx.shadowColor = star.color
        }
        
        ctx.globalAlpha = star.opacity * (1 - star.z)
        ctx.fillStyle = star.color
        ctx.beginPath()
        ctx.arc(x + parallaxX, y + parallaxY, star.size * scale * 0.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        return star
      })

      setStars(updatedStars)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [stars, mousePosition, isMouseDown, speedMultiplier, resolvedTheme])

  // Handle speed control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setSpeedMultiplier(2.5) // 适度提高加速倍率
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setSpeedMultiplier(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-20 transition-colors duration-300 overflow-x-hidden"
      style={{ pointerEvents: 'none' }}
    />
  )
}
