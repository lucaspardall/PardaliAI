import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function TestimonialsSection() {
  return (
    <section className="bg-muted py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4 font-heading gradient-heading">
            Resultados comprovados
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Veja como o CIP Shopee está ajudando vendedores a alavancar seus negócios.
          </p>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-24 h-24 md:w-28 md:h-28">
                  <AvatarImage 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150"
                    alt="Ana Silva, vendedora da Shopee" 
                  />
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex mb-3">
                    {Array(5).fill(0).map((_, i) => (
                      <i key={i} className="ri-star-fill text-yellow-400"></i>
                    ))}
                  </div>
                  <p className="text-foreground/90 text-lg italic mb-4">
                    "Depois de apenas 1 mês usando o CIP Shopee, conseguimos aumentar nosso CTR em 45% e as vendas em 27%. 
                    A facilidade de uso e os resultados rápidos me surpreenderam positivamente."
                  </p>
                  <div>
                    <h4 className="font-semibold">Ana Silva</h4>
                    <p className="text-muted-foreground">Loja de Acessórios | São Paulo</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              name: "Carlos Mendes",
              role: "Loja de Eletrônicos",
              quote: "A otimização de IA para descrições de produtos melhorou nossa taxa de conversão em 34%.",
              avatar: "CM"
            },
            {
              name: "Juliana Costa",
              role: "Moda Feminina",
              quote: "O dashboard com métricas em tempo real mudou completamente nossa estratégia de vendas.",
              avatar: "JC"
            },
            {
              name: "Roberto Alves",
              role: "Loja de Games",
              quote: "O suporte é excelente e o tempo de implementação foi surpreendentemente rápido.",
              avatar: "RA"
            }
          ].map((testimonial, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Avatar className="w-16 h-16 mb-4 mt-2">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-foreground/90 italic mb-4 text-sm">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}