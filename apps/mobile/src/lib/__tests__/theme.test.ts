import { colors, globalStyles } from '../theme';

describe('theme', () => {
  describe('colors', () => {
    it('exports all required colors', () => {
      expect(colors.primary).toBe('#2563eb');
      expect(colors.success).toBe('#16a34a');
      expect(colors.warning).toBe('#f59e0b');
      expect(colors.danger).toBe('#dc2626');
      expect(colors.background).toBeTruthy();
      expect(colors.surface).toBeTruthy();
      expect(colors.text).toBeTruthy();
      expect(colors.textSecondary).toBeTruthy();
      expect(colors.textMuted).toBeTruthy();
      expect(colors.border).toBeTruthy();
      expect(colors.white).toBe('#ffffff');
    });
  });

  describe('globalStyles', () => {
    it('exports container style', () => {
      expect(globalStyles.container).toMatchObject({
        flex: 1,
        backgroundColor: colors.background,
      });
    });

    it('exports card style with border radius', () => {
      expect(globalStyles.card).toMatchObject({
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
      });
    });

    it('exports button style', () => {
      expect(globalStyles.button).toMatchObject({
        backgroundColor: colors.primary,
        borderRadius: 10,
      });
    });

    it('exports row and spaceBetween layouts', () => {
      expect(globalStyles.row).toMatchObject({
        flexDirection: 'row',
        alignItems: 'center',
      });
      expect(globalStyles.spaceBetween).toMatchObject({
        flexDirection: 'row',
        justifyContent: 'space-between',
      });
    });

    it('exports text styles', () => {
      expect(globalStyles.cardTitle).toBeDefined();
      expect(globalStyles.cardSubtitle).toBeDefined();
      expect(globalStyles.sectionTitle).toBeDefined();
      expect(globalStyles.emptyText).toBeDefined();
      expect(globalStyles.buttonText).toBeDefined();
      expect(globalStyles.badgeText).toBeDefined();
    });
  });
});
