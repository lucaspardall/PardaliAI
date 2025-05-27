
import { motion } from "framer-motion";

export default function StatsSection() {
  const stats = [
    {
      number: "45%",
      label: "Aumento médio no CTR",
      description: "Taxa de cliques melhorada com títulos otimizados por IA"
    },
    {
      number: "500+",
      label: "Vendedores ativos",
      description: "Lojas que confiam na nossa plataforma"
    },
    {
      number: "27%",
      label: "Crescimento em vendas",
      description: "Aumento médio nas conversões em 30 dias"
    },
    {
      number: "72h",
      label: "Tempo de implementação",
      description: "Da conexão aos primeiros resultados"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4 font-heading gradient-heading">
            Resultados comprovados que você pode esperar
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Nossos vendedores veem melhorias significativas em métricas-chave em poucas semanas.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="bg-white/50 dark:bg-card/50 p-6 rounded-xl border backdrop-blur-sm">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="font-semibold text-foreground mb-2">
                  {stat.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
